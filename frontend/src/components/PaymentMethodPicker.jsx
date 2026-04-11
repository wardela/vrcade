export default function PaymentMethodPicker({
  methods,
  value,
  onChange,
  disabled = false,
  title = "",
  columnsClassName = "grid-cols-3",
}) {
  return (
    <div className="space-y-2">
      {title ? <div className="text-sm font-semibold text-gray-700">{title}</div> : null}
      <div className={`grid ${columnsClassName} gap-2`}>
        {methods.map((method) => (
          <button
            key={method.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === method.value
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {method.label}
          </button>
        ))}
      </div>
    </div>
  );
}
