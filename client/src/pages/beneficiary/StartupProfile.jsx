import { useEffect, useRef, useState } from "react";
import { Pencil, User } from "lucide-react";
import ownerArtwork from "../../assets/profile-owner.webp";
import storeArtwork from "../../assets/startup-store.webp";
import AccessRestricted from "../../components/AccessRestricted";
import PageHeader from "../../components/beneficiary/PageHeader";
import ProfileForm from "../../components/beneficiary/ProfileForm";
import ProfileSummary from "../../components/beneficiary/ProfileSummary";
import Toast from "../../components/beneficiary/Toast";
import { ModuleError, ProfileSkeleton } from "../../components/beneficiary/ModuleState";
import useBeneficiaryResource from "../../hooks/useBeneficiaryResource";
import { PROFILE_API_CONTRACT } from "../../services/beneficiaryContract.js";
import { createStartupProfile, getStartupProfile, updateStartupProfile } from "../../services/startupProfileService.js";
import "../../styles/week2.css";

export default function StartupProfile() {
  const resource = useBeneficiaryResource(getStartupProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveController = useRef(null);
  const profile = resource.data;
  const showForm = resource.status === "ready" && (!profile || editing);

  useEffect(() => () => saveController.current?.abort(), []);

  const save = async (values) => {
    if (saveController.current) return;
    const controller = new AbortController();
    saveController.current = controller;
    setSaving(true);
    setSaveError("");
    resource.dismissNotice();
    try {
      const writeProfile = profile ? updateStartupProfile : createStartupProfile;
      const saved = await writeProfile(values, { signal: controller.signal });
      if (controller.signal.aborted) return;
      resource.replaceData(saved);
      setEditing(false);
      resource.notifySuccess(profile ? "Startup profile updated successfully." : "Startup profile created successfully.");
    } catch (error) {
      if (!controller.signal.aborted) setSaveError(resource.reportError(error, true) ?? "");
    } finally {
      if (!controller.signal.aborted) setSaving(false);
      if (saveController.current === controller) saveController.current = null;
    }
  };

  if (resource.status === "forbidden") return <AccessRestricted />;

  return (
    <div className="w2-page">
      <Toast notice={resource.notice} onClose={resource.dismissNotice} />
      <PageHeader
        title={showForm ? profile ? "Edit Your Startup Profile" : "Create Your Startup Profile" : "My Startup Profile"}
        description={showForm ? profile ? "Keep your business information up to date." : "Tell us about your business to unlock more opportunities." : "View and update your business information."}
        image={showForm ? storeArtwork : undefined}
        icon={User}
        action={resource.status === "ready" && profile && !editing ? <button type="button" className="w2-button w2-button--secondary" onClick={() => { setSaveError(""); setEditing(true); }}><Pencil aria-hidden="true" /> Edit Profile</button> : null}
      >
        {showForm && <img src={ownerArtwork} alt="" className="w2-owner-art" />}
      </PageHeader>
      {resource.status === "loading" && <ProfileSkeleton />}
      {resource.status === "error" && <ModuleError title="Could not load your startup profile" message={resource.error} onRetry={resource.retry} />}
      {showForm && <ProfileForm profile={profile} descriptionWritable={PROFILE_API_CONTRACT.descriptionWritable} saving={saving} onSave={save} onCancel={profile ? () => { setEditing(false); setSaveError(""); resource.dismissNotice(); } : undefined} error={saveError} />}
      {resource.status === "ready" && profile && !editing && <ProfileSummary profile={profile} />}
    </div>
  );
}
