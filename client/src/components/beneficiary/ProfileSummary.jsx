import { CircleCheck, Leaf, MapPin } from "lucide-react";
import growthArtwork from "../../assets/startup-growth.webp";
import { LeafAccent } from "./ModuleState";

export default function ProfileSummary({ profile }) {
  const complete = Boolean(profile.businessName?.trim() && profile.sector?.trim() && profile.region?.trim());
  return (
    <>
      <section className="w2-panel w2-profile-summary" aria-label="Startup information">
        <img src={growthArtwork} alt="" className="w2-profile-art" />
        <dl className="w2-profile-facts">
          <div><dt>Business Name</dt><dd className="w2-business-name">{profile.businessName || "Not provided"}</dd></div>
          <div><dt>Sector</dt><dd><Leaf aria-hidden="true" />{profile.sector || "Not provided"}</dd></div>
          <div><dt>Region</dt><dd><MapPin aria-hidden="true" />{profile.region || "Not provided"}</dd></div>
        </dl>
        {profile.description && <div className="w2-profile-description"><h2>Description</h2><p>{profile.description}</p></div>}
      </section>
      <section className="w2-panel w2-profile-status">
        <h2>Profile Status</h2>
        <p className={`w2-completion-message ${complete ? "" : "w2-completion-message--incomplete"}`}>
          <CircleCheck aria-hidden="true" />
          {complete ? "Your startup information is complete." : "Add your business name, sector, and region to complete your profile."}
        </p>
        <h3>Need to make changes?</h3>
        <p>Click the edit button above to update your profile.</p>
        <LeafAccent />
      </section>
    </>
  );
}
