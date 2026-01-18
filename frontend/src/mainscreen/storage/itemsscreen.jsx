import React, { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import UnitsModal from "./unitsmodal";
import CategoryModal from "./categorymodal";
import ItemCard from "./itemcard";
import ItemSearchModal from "./itemsearchmodal";
import { useTranslation } from "react-i18next";
const ItemsScreen = () => {
  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const itemPerm = permissions?.items || {};
const {t} = useTranslation();
const canViewItems = itemPerm.view === true;
const canAddItem = itemPerm.add === true;
const canEditItem = itemPerm.edit === true;

// Semantic helpers
const isViewOnly = canViewItems && !canAddItem && !canEditItem;
const canAddOnly = canAddItem && !canEditItem;
const canEditOnly = canEditItem && !canAddItem;
const canAddAndEdit = canAddItem && canEditItem;

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

const [searchTerm, setSearchTerm] = useState("");

const filteredItems = React.useMemo(() => {
  if (!searchTerm.trim()) return items;

  const q = searchTerm.toLowerCase();

  return items.filter((item) =>
    item.name?.toLowerCase().includes(q) ||
    item.code?.toLowerCase().includes(q)
  );
}, [items, searchTerm]);

  // Fetch Items
const fetchItems = async (catId) => {
  try {
    const res = await api.get(
      `/api/invoices/categories/${catId}/items`
    );

    // Sort fav items to the top
    const sorted = res.data.sort((a, b) => {
      if (a.fav === b.fav) return 0;
      return a.fav ? -1 : 1;
    });

    setItems(sorted);
  } catch (err) {
    console.error("Error loading items:", err);
  }
};


useEffect(() => {
  const load = async () => {
    try {
      // Load categories
      const res = await api.get(`/api/invoices/categories`);
      setCategories(res.data);

      // Load fav items (default view)
      const favRes = await api.get(`/api/invoices/items/favorites`);
      const sorted = favRes.data.sort((a, b) => (a.fav === b.fav ? 0 : a.fav ? -1 : 1));
      setItems(sorted);

      // No category selected
      setSelectedCategory(null);

    } catch (err) {
      console.error("Error loading items:", err);
    }
  };

  load();
}, []);

const toggleFavorite = async (itemId) => {
  try {
    await api.patch(`/api/invoices/items/${itemId}/toggle-fav`);

    // Update local state immediately
    setItems((prev) =>
      prev
        .map((it) =>
          it.id === itemId ? { ...it, fav: !it.fav } : it
        )
        .sort((a, b) => {
          if (a.fav === b.fav) return 0;
          return a.fav ? -1 : 1;
        })
    );
  } catch (err) {
    console.error("Error toggling favorite:", err);
  }
};

const refreshCategories = async () => {
  const res = await api.get(`/api/invoices/categories`);
  setCategories(res.data);
};

const refreshItems = async () => {
  if (selectedCategory) {
    await fetchItems(selectedCategory);
  } else {
    const favRes = await api.get(`/api/invoices/items/favorites`);
    const sorted = favRes.data.sort((a, b) =>
      a.fav === b.fav ? 0 : a.fav ? -1 : 1
    );
    setItems(sorted);
  }
};


  return (
    <div className="flex flex-col w-full h-screen bg-base-200 ">

      <div className="flex justify-between items-center  border-b bg-white p-4">
        <h1 className="text-2xl font-semibold text-gray-700 tracking-wide">
          {t("ItemsScreen.title")}
        </h1>

        <div className="flex gap-3">
            <button
            onClick={() => setUnitsModalOpen(true)}
            className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
            >
             {t("ItemsScreen.buttons.units")}
            </button>

            {canAddItem && (
              <button
                onClick={() => {
                  setSelectedItemId(null);
                  setIsEdit(false);
                  setItemModalOpen(true);
                }}
                className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
              >
                {t("ItemsScreen.buttons.add_item")}
              </button>
            )}
        </div>
      </div>

      <div className="flex  h-full ">

        <div className="w-1/5 bg-gray-200 border border-gray-300 flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
                {t("ItemsScreen.sections.categories")}
            </h2>

            <div className="flex gap-2">
                {/* Add Category */}
                {canEditItem && (
                  <button
                    className="px-2 py-1 text-sm bg-[#2f788a] text-white rounded hover:bg-[#276472]"
                    onClick={() => setCategoryModalOpen(true)}
                  >
                    {t("ItemsScreen.buttons.manage_categories")}
                  </button>
                )}
                {/* Show Favorites */}
                <button
                className="px-2 py-1 text-sm bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={async () => {
                    try {
                    const res = await api.get(`/api/invoices/items/favorites`);
                    const sorted = res.data.sort((a, b) =>
                        a.fav === b.fav ? 0 : a.fav ? -1 : 1
                    );
                    setItems(sorted);
                    setSelectedCategory(null); // No category selected when viewing favorites
                    setSearchTerm("");
                    } catch (err) {
                    console.error("Error loading favorites:", err);
                    }
                }}
                >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
                </button>
            </div>
            </div>

          <div className="p-3 flex flex-col gap-2 overflow-y-auto bg-gray-200">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  fetchItems(cat.id);
                  setSearchTerm("");
                }}
                className={`cursor-pointer p-3 border rounded text-sm flex justify-between
                  ${
                    selectedCategory === cat.id
                      ? "bg-[#e5f6f8] border-[#2f788a] text-[#2f788a] font-semibold"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }
                `}
              >
                <span>{cat.name}</span>
                <span className="text-xs opacity-70">{cat.items_count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow bg-white border border-gray-300 rounded-lg p-4 overflow-auto m-4 shadow-lg">
          <div className="flex items-center  border-b justify-between mb-3 pb-2">
          <h2 className="text-lg font-semibold text-gray-700">
            {t("ItemsScreen.sections.items")}
          </h2>
              <button
      onClick={() => setSearchModalOpen(true)}
      className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
      title="Search all items"
    >
      {t("ItemsScreen.buttons.search_all")}
    </button>
    </div>
<div className="flex items-center justify-between mb-3 gap-4">
  <h2 className="text-lg font-semibold text-gray-700">
    {selectedCategory ? t("ItemsScreen.sections.items_in_category") : t("ItemsScreen.sections.favorite_items")}
  </h2>

  <div className="flex items-center gap-2">
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={
        selectedCategory
          ? t("ItemsScreen.search.category_placeholder")
          : t("ItemsScreen.search.favorites_placeholder")
      }
      className="h-[38px] px-3 border rounded-lg text-sm w-[220px]
                 focus:outline-none focus:ring-2
                 focus:ring-[#2f788a]/40"
    />
  </div>
</div>

          <table className="w-full border-collapse text-sm bg-white">
            <thead className="bg-gray-100 text-gray-700 border-b">
              <tr>
                <th className="p-2 border text-start">{t("ItemsScreen.table.id")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.code")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.name")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.unit")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.price")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.tax")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.category")}</th>
                <th className="p-2 border text-start">{t("ItemsScreen.table.stock")}</th>
                <th className="p-2 border text-center">{t("ItemsScreen.table.favorite")}</th>
              </tr>
            </thead>

            <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                        setSelectedItemId(item.id);
                        setIsEdit(true);
                        setItemModalOpen(true);
                    }}
                    >
                    <td className="p-2 border">{item.id}</td>
                    <td className="p-2 border">{item.code}</td>
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">{item.unit_name || "-"}</td>
                    <td className="p-2 border">{item.price_with_tax}</td>
                    <td className="p-2 border">{item.tax_percentage}</td>
                    <td className="p-2 border">{item.category_name}</td>
                    <td className="p-2 border">{item.stock_qty}</td>
                    <td className="p-2 border flex justify-center items-center">
                      <button
                        disabled={!canEditItem}
                        onClick={(e) => {
                          if (!canEditItem) return;
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className={`flex justify-center items-center
                          ${!canEditItem ? "opacity-40 cursor-not-allowed" : ""}
                        `}
                      >
                            {item.fav ? (
                            <span className="text-[#2f788a] font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
                                    fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd"
                                    d="M10.788 3.21c.448-1.077 1.976-1.077 
                                    2.424 0l2.082 5.006 5.404.434c1.164.093 
                                    1.636 1.545.749 2.305l-4.117 3.527 
                                    1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 
                                    18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425
                                    l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305
                                    l5.404-.434 2.082-5.005Z"
                                    clipRule="evenodd" />
                                </svg>
                            </span>
                            ) : (
                            <span className="text-gray-400 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                                    viewBox="0 0 24 24" strokeWidth="1.5" 
                                    stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 
                                    5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04 
                                    .701.663.321.988l-4.204 3.602a.563.563 0 0 
                                    0-.182.557l1.285 5.385a.562.562 0 0 
                                    1-.84.61l-4.725-2.885a.562.562 0 0 
                                    0-.586 0L6.982 20.54a.562.562 0 0 
                                    1-.84-.61l1.285-5.386a.562.562 0 0 
                                    0-.182-.557l-4.204-3.602a.562.562 0 0 
                                    1 .321-.988l5.518-.442a.563.563 0 0 
                                    0 .475-.345L11.48 3.5Z" />
                                </svg>
                            </span>
                            )}
                        </button>
                        </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="p-4 text-center text-gray-500"
                    colSpan={9}
                  >
                    {t("ItemsScreen.empty.no_items")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
      {unitsModalOpen && (
  <UnitsModal
    isOpen={unitsModalOpen}
    onClose={() => setUnitsModalOpen(false)}
      canAddItem={canAddItem}
  canEditItem={canEditItem}
  />
)}
{categoryModalOpen && (
<CategoryModal
  isOpen={categoryModalOpen}
  onClose={() => setCategoryModalOpen(false)}
  onSaved={async () => {
    await refreshCategories();
    await refreshItems();
  }}
  canEditItem={canEditItem}
/>
)}
{itemModalOpen && (
<ItemCard
  isOpen={itemModalOpen}
  onClose={() => {
    setItemModalOpen(false);
    setSelectedItemId(null);
    setIsEdit(false);
  }}
  onSaved={async () => {
    await refreshCategories();   // updates counts on the left
    await refreshItems();        // updates item table
  }}
  itemId={selectedItemId}
  isEdit={isEdit}
  canAddItem={canAddItem}
  canEditItem={canEditItem}
/>
)}
{searchModalOpen && (
  <ItemSearchModal
    onClose={() => setSearchModalOpen(false)}
    onSelect={(id) => {
      setSearchModalOpen(false);
      setSelectedItemId(id);
      setIsEdit(true);
      setItemModalOpen(true);
    }}
  />
)}
    </div>
  );
};

export default ItemsScreen;
