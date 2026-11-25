const sensitiveMetadataKey = /(password|token|otp|secret|authorization|bankaccountnumber)/i;

function redactSensitiveMetadata(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveMetadata);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitiveMetadataKey.test(key))
        .map(([key, item]) => [key, redactSensitiveMetadata(item)]),
    );
  }
  return value;
}

module.exports = { redactSensitiveMetadata };
