function serializeValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

function escapeCell(value) {
  let text = serializeValue(value);
  const isNumericValue =
    typeof value === "number" ||
    typeof value === "bigint" ||
    (typeof value === "string" &&
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(text.trim()));

  if (!isNumericValue && /^\s*[=+\-@]/u.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/u.test(text)
    ? `"${text.replace(/"/gu, '""')}"`
    : text;
}

function normalizeColumns(rows, columns) {
  const definitions = columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);

  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new TypeError("Provide columns when exporting an empty array.");
  }

  return definitions.map((column) => {
    if (typeof column === "string") {
      return { key: column, label: column };
    }

    if (!column || typeof column.key !== "string") {
      throw new TypeError("Each CSV column must be a key or an object with a key.");
    }

    return {
      key: column.key,
      label: column.label ?? column.key,
    };
  });
}

export function objectsToCsv(rows, columns) {
  if (!Array.isArray(rows)) {
    throw new TypeError("CSV data must be an array of objects.");
  }

  const columnDefinitions = normalizeColumns(rows, columns);
  const lines = [
    columnDefinitions.map((column) => escapeCell(column.label)).join(","),
    ...rows.map((row) =>
      columnDefinitions
        .map((column) => escapeCell(row?.[column.key]))
        .join(",")
    ),
  ];

  return lines.join("\r\n");
}

export function downloadCsv(rows, filename = "report.csv", columns) {
  if (typeof filename !== "string" || !filename.trim()) {
    throw new TypeError("A non-empty CSV filename is required.");
  }

  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error("CSV downloads are only available in a browser.");
  }

  const blob = new Blob(["\uFEFF", objectsToCsv(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
