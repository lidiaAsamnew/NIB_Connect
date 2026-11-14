export default function PageHeader({ title, description, icon: Icon, image, action, children }) {
  return (
    <header className={`w2-page-header ${children ? "w2-page-header--illustrated" : ""}`}>
      <div className="w2-page-heading">
        {image ? <img src={image} alt="" className="w2-heading-art" /> : Icon && (
          <span className="w2-heading-icon"><Icon aria-hidden="true" /></span>
        )}
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {action}
      {children}
    </header>
  );
}
