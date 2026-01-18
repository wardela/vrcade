import { useTranslation } from "react-i18next";
export default function ClientCard({ client, onClick }) {
  const {t} = useTranslation();

  return (
    <div
      onClick={() => onClick(client)}
      className="
        group cursor-pointer
        bg-white border border-gray-200 rounded-xl
        p-4 flex items-center gap-4
        transition-all duration-200
        hover:shadow-lg hover:-translate-y-[1px]
        hover:border-[#2f788a]/40
      "
    >
      {/* Avatar */}
      <div className="
        w-12 h-12 rounded-full
        bg-[#2f788a] text-white
        flex items-center justify-center
        font-semibold text-lg
        shrink-0
      ">
        {client.name?.charAt(0) || "?"}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold text-gray-800 truncate">
          {client.name}
        </span>

<div className="mt-1 inline-flex items-center gap-2">
  <span
    className="
      inline-flex items-center justify-center
      w-6 h-6 rounded-lg
      bg-gray-50 border border-gray-200
      text-gray-500
      group-hover:text-[#2f788a]
      group-hover:border-[#2f788a]/30
      transition
    "
    title="Phone"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  </span>

  <span className="text-sm text-gray-600">
    {client.phone ? (
      <span className="font-medium text-gray-700">{client.phone}</span>
    ) : (
      <span className="text-gray-400">{t("ClientCard.no_phone")}</span>
    )}
  </span>
</div>

      </div>

      {/* Chevron */}
      <div className="text-gray-400 group-hover:text-[#2f788a] transition">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
