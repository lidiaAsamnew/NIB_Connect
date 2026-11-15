function validate(schema, source = "body") {
  if (!["body", "query", "params"].includes(source)) {
    throw new Error(`Unsupported validation source: ${source}`);
  }

  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.length > 0 ? issue.path.join(".") : "_";
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
      });
    }

    req[`validated${source[0].toUpperCase()}${source.slice(1)}`] = result.data;
    return next();
  };
}

module.exports = { validate };
