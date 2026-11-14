import { useRef, useState } from "react";
import { Check, Leaf, LoaderCircle, MapPin } from "lucide-react";
import FormField from "../FormField";
import { STARTUP_REGIONS, STARTUP_SECTORS, validateStartupProfile } from "../../utils/beneficiary";
import { LeafAccent } from "./ModuleState";

function optionsIncludingCurrent(options, current) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

export default function ProfileForm({ profile, descriptionWritable = false, saving, onSave, onCancel, error }) {
  const formRef = useRef(null);
  const [values, setValues] = useState(() => ({
    businessName: profile?.businessName ?? "",
    sector: profile?.sector ?? "",
    region: profile?.region ?? "",
    description: profile?.description ?? "",
  }));
  const [errors, setErrors] = useState({});

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (saving) return;
    const found = validateStartupProfile(values, descriptionWritable);
    setErrors(found);
    if (Object.keys(found).length) {
      formRef.current?.elements.namedItem(Object.keys(found)[0])?.focus();
      return;
    }
    onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])));
  };

  return (
    <section className="w2-panel w2-profile-form">
      <h2>Startup Information</h2>
      <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={saving}>
        {error && <p role="alert" className="w2-form-error">{error}</p>}
        <fieldset disabled={saving}>
          <legend className="sr-only">Startup information</legend>
          <div className="w2-form-grid">
            <FormField id="businessName" label="Business Name" value={values.businessName} placeholder="Enter your business name" autoComplete="organization" onChange={onChange} error={errors.businessName} />
            <FormField id="sector" label="Sector" as="select" icon={Leaf} value={values.sector} onChange={onChange} error={errors.sector}>
              <option value="">Select a sector</option>
              {optionsIncludingCurrent(STARTUP_SECTORS, values.sector).map((sector) => <option key={sector} value={sector}>{sector}</option>)}
            </FormField>
            <FormField id="region" label="Region" as="select" icon={MapPin} value={values.region} onChange={onChange} error={errors.region}>
              <option value="">Select a region</option>
              {optionsIncludingCurrent(STARTUP_REGIONS, values.region).map((region) => <option key={region} value={region}>{region}</option>)}
            </FormField>
              <div className="w2-description-field">
                <label htmlFor="description">Business Description <span>(Optional)</span></label>
                <textarea id="description" name="description" value={values.description} placeholder={descriptionWritable ? "Tell us a little about your business" : "Description editing is not available yet"} rows={3} maxLength={500} disabled={!descriptionWritable || saving} onChange={onChange} aria-invalid={Boolean(errors.description)} aria-describedby={`description-count${!descriptionWritable ? " description-note" : ""}${errors.description ? " description-error" : ""}`} />
                <p id="description-count" className="w2-character-count">{values.description.length}/500</p>
                {!descriptionWritable && <p id="description-note" className="w2-field-note">Business description editing is not available yet.</p>}
                {errors.description && <p id="description-error" className="w2-validation-error">{errors.description}</p>}
              </div>
          </div>
          <div className="w2-form-actions">
            {onCancel && <button type="button" className="w2-button w2-button--secondary" onClick={onCancel}>Cancel</button>}
            <button type="submit" className="w2-button w2-save-button" disabled={saving}>
              {saving ? <LoaderCircle aria-hidden="true" className="w2-spin" /> : <Check aria-hidden="true" />}
              {saving ? "Saving…" : profile ? "Save Changes" : "Save Profile"}
            </button>
          </div>
        </fieldset>
      </form>
      <LeafAccent />
    </section>
  );
}
