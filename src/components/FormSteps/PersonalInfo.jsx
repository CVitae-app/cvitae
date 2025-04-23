import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../../contexts/LanguageContext";
import { supabase } from "../../utils/supabaseClient";
import imageCompression from "browser-image-compression";

const OPTIONAL_FIELDS = [
  { name: "birthdate", type: "date" },
  { name: "birthplace", type: "text" },
  { name: "nationality", type: "text" },
  { name: "license", type: "select", options: ["yes", "no"] },
  { name: "gender", type: "select", options: ["male", "female"] },
  { name: "maritalStatus", type: "select", options: ["single", "married", "cohabiting", "divorced", "widowed"] },
  { name: "website", type: "text" },
  { name: "linkedin", type: "text" },
];

const INITIAL_FIELDS = ["firstName", "lastName", "email", "phone", "address", "postalCode", "city"];

function PersonalInfo({ onChange, value = {}, currentCVId }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);

  const [form, setForm] = useState(() => ({
    photo: null,
    photoPreview: typeof value.photo === "string" ? value.photo : null,
    ...INITIAL_FIELDS.reduce((acc, key) => ({ ...acc, [key]: "" }), {}),
    ...value,
  }));

  const [errors, setErrors] = useState({});
  const [extraFields, setExtraFields] = useState([]);

  useEffect(() => {
    const initialExtra = OPTIONAL_FIELDS.map(f => f.name).filter(name => value?.[name]);
    setExtraFields(initialExtra);
    setForm(prev => ({
      ...prev,
      ...value,
      photoPreview: typeof value.photo === "string" ? value.photo : null,
    }));
  }, []);

  useEffect(() => {
    const { photoPreview, ...data } = form;
    onChange(data);
  }, [form]);

  const validate = useCallback((name, val) => {
    const error = {};
    if (["firstName", "lastName"].includes(name) && !/^[\p{L}\s'-]+$/u.test(val)) {
      error[name] = t("onlyLettersAllowed");
    }
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      error[name] = t("invalidEmail");
    }
    if (name === "photo" && val?.size > 5 * 1024 * 1024) {
      error[name] = t("max5mb");
    }
    return error;
  }, [t]);

  const uploadPhotoToSupabase = async (file) => {
    if (!currentCVId) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentCVId}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return null;

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  };

  const handleChange = useCallback(async (e) => {
    const { name, value, files } = e.target;
    let newErrors = { ...errors };

    if (name === "photo" && files?.[0]) {
      const file = files[0];
      const valid = validate(name, file);
      if (!Object.keys(valid).length) {
        try {
          const compressedBlob = await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 600,
            useWebWorker: true,
          });

          const compressedFile = new File([compressedBlob], file.name, {
            type: compressedBlob.type,
          });

          const publicUrl = await uploadPhotoToSupabase(compressedFile);
          if (!publicUrl) return;

          setForm(prev => ({
            ...prev,
            photo: publicUrl,
            photoPreview: publicUrl,
          }));

          delete newErrors[name];
        } catch {
          newErrors[name] = t("uploadFailed");
        }
      } else {
        newErrors = { ...newErrors, ...valid };
      }

      setErrors(newErrors);
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    const valid = validate(name, value);
    if (!Object.keys(valid).length) delete newErrors[name];
    else newErrors = { ...newErrors, ...valid };
    setErrors(newErrors);
  }, [errors, validate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith("image/")) {
      handleChange({ target: { name: "photo", files: [file] } });
    }
  }, [handleChange]);

  const removePhoto = useCallback(() => {
    setForm(prev => ({
      ...prev,
      photo: null,
      photoPreview: null,
    }));
    localStorage.removeItem("cv-photo-preview");
  }, []);

  const addField = (key) => {
    if (!extraFields.includes(key)) {
      setExtraFields(prev => [...prev, key]);
    }
  };

  const removeField = (key) => {
    setExtraFields(prev => prev.filter(k => k !== key));
    setForm(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const availableFields = useMemo(
    () => OPTIONAL_FIELDS.filter(f => !extraFields.includes(f.name)),
    [extraFields]
  );

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("personalInfo")}</h2>

      {/* Photo Upload */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">{t("photo")}</label>
        <div
          className="w-20 h-20 border-2 border-dashed rounded-xl border-gray-300 flex items-center justify-center cursor-pointer relative group overflow-hidden"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {form.photoPreview ? (
            <>
              <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                className="absolute top-1 right-1 bg-white p-0.5 rounded-full shadow hover:bg-red-100"
              >
                <XMarkIcon className="w-4 h-4 text-red-500" />
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 group-hover:text-gray-600 text-center px-2">
              {t("uploadPhoto")}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
        {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
      </div>

      {/* Main Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INITIAL_FIELDS.map((field) => (
          <div key={field} className={field === "address" ? "sm:col-span-2" : ""}>
            <label htmlFor={field} className="block font-medium mb-1">{t(field)}</label>
            <input
              id={field}
              name={field}
              type={field === "email" ? "email" : "text"}
              value={form[field] || ""}
              onChange={handleChange}
              className={`w-full border px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                errors[field] ? "border-red-500" : ""
              }`}
            />
            {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
          </div>
        ))}
      </div>

      {/* Extra Fields */}
      {extraFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {extraFields.map((key) => {
            const field = OPTIONAL_FIELDS.find(f => f.name === key);
            if (!field) return null;

            return (
              <div key={key} className="relative">
                <label htmlFor={key} className="block font-medium mb-1">{t(key)}</label>
                {field.type === "select" ? (
                  <select
                    id={key}
                    name={key}
                    value={form[key] || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-1.5 rounded-xl text-sm"
                  >
                    <option value="">{t("select")}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{t(opt)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={key}
                    name={key}
                    type={field.type}
                    value={form[key] || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-1.5 rounded-xl text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeField(key)}
                  className="absolute right-2 top-2 text-red-400 hover:text-red-600"
                  title={t("remove")}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestions */}
      {availableFields.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-400 mb-2">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
            {availableFields.map(f => (
              <button
                key={f.name}
                onClick={() => addField(f.name)}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 transition"
              >
                + {t(f.name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonalInfo;
