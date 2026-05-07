import { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import Navbar from "../components/navbar";

// ────────────────────────────────────────────────────────
// DEFAULT CATEGORIES SCHEMA
// Shape: [{ id, name, subcategories: [{ id, name }] }]
// ────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  {
    id: "cat-1",
    name: "License",
    subcategories: [
      { id: "sc-1-1", name: "Tool / Platform Licence" },
      { id: "sc-1-2", name: "Enterprise Licence" },
      { id: "sc-1-3", name: "User-based Licence" },
      { id: "sc-1-4", name: "Device-based Licence" },
      { id: "sc-1-5", name: "API / Integration Licence" },
    ],
  },
  {
    id: "cat-2",
    name: "Subscription",
    subcategories: [
      { id: "sc-2-1", name: "Monthly Subscription" },
      { id: "sc-2-2", name: "Quarterly Subscription" },
      { id: "sc-2-3", name: "Annual Subscription" },
      { id: "sc-2-4", name: "Auto-renewal Subscription" },
      { id: "sc-2-5", name: "One-time Subscription" },
      { id: "sc-2-6", name: "Add-on / Feature Subscription" },
    ],
  },
  {
    id: "cat-3",
    name: "Agreement / Contract",
    subcategories: [
      { id: "sc-3-1", name: "Service Agreement" },
      { id: "sc-3-2", name: "SLA (Service Level Agreement)" },
      { id: "sc-3-3", name: "MSA (Master Service Agreement)" },
      { id: "sc-3-4", name: "NDA (Non-Disclosure Agreement)" },
      { id: "sc-3-5", name: "Vendor Agreement" },
      { id: "sc-3-6", name: "Partner / Channel Agreement" },
      { id: "sc-3-7", name: "AMC (Annual Maintenance Contract)" },
    ],
  },
  {
    id: "cat-4",
    name: "Compliance & Legal",
    subcategories: [
      { id: "sc-4-1", name: "Statutory Licence" },
      { id: "sc-4-2", name: "Regulatory Approval" },
      { id: "sc-4-3", name: "Data Protection / Privacy Compliance" },
      { id: "sc-4-4", name: "Security Compliance" },
    ],
  },
  {
    id: "cat-5",
    name: "Certification",
    subcategories: [
      { id: "sc-5-1", name: "ISO Certification" },
      { id: "sc-5-2", name: "Information Security Certification" },
      { id: "sc-5-3", name: "Quality Certification" },
      { id: "sc-5-4", name: "Industry-Specific Certification" },
      { id: "sc-5-5", name: "Employee Skill Certification" },
      { id: "sc-5-6", name: "Training Certification" },
      { id: "sc-5-7", name: "Audit-based Certification" },
    ],
  },
  {
    id: "cat-6",
    name: "IT",
    subcategories: [
      { id: "sc-6-1", name: "Hardware AMC" },
      { id: "sc-6-2", name: "Server Renewal" },
      { id: "sc-6-3", name: "Cloud Infrastructure" },
      { id: "sc-6-4", name: "Domain Renewal" },
      { id: "sc-6-5", name: "SSL Certificate" },
      { id: "sc-6-6", name: "Email Hosting" },
      { id: "sc-6-7", name: "Network & Firewall" },
      { id: "sc-6-8", name: "Backup & DR Services" },
    ],
  },
  {
    id: "cat-7",
    name: "Support & Maintenance",
    subcategories: [
      { id: "sc-7-1", name: "Technical Support Contract" },
      { id: "sc-7-2", name: "Maintenance Contract" },
      { id: "sc-7-3", name: "Upgrade / Update Support" },
      { id: "sc-7-4", name: "Priority Support Plan" },
    ],
  },
  {
    id: "cat-8",
    name: "Warranty",
    subcategories: [
      { id: "sc-8-1", name: "Product Warranty" },
      { id: "sc-8-2", name: "Extended Warranty" },
      { id: "sc-8-3", name: "Hardware Warranty" },
      { id: "sc-8-4", name: "Device Warranty" },
      { id: "sc-8-5", name: "OEM Warranty" },
      { id: "sc-8-6", name: "On-site Warranty" },
      { id: "sc-8-7", name: "Replacement Warranty" },
    ],
  },
  {
    id: "cat-9",
    name: "Insurance",
    subcategories: [
      { id: "sc-9-1",  name: "Asset Insurance" },
      { id: "sc-9-2",  name: "Equipment Insurance" },
      { id: "sc-9-3",  name: "IT / Cyber Insurance" },
      { id: "sc-9-4",  name: "Professional Indemnity Insurance" },
      { id: "sc-9-5",  name: "General Liability Insurance" },
      { id: "sc-9-6",  name: "Employee Insurance" },
      { id: "sc-9-7",  name: "Health Insurance" },
      { id: "sc-9-8",  name: "Group Medical Insurance" },
      { id: "sc-9-9",  name: "Directors & Officers (D&O) Insurance" },
      { id: "sc-9-10", name: "Vehicle / Fleet Insurance" },
      { id: "sc-9-11", name: "Property Insurance" },
    ],
  },
];

// ────────────────────────────────────────────────────────
// useCategoriesStore – hook for full CRUD
// Usage in App.js:
//   const catStore = useCategoriesStore();
//   <NewForm categories={catStore.categories} ... />
//   <CategoryManager store={catStore} />
// ────────────────────────────────────────────────────────
export function useCategoriesStore(initial = DEFAULT_CATEGORIES) {
  const [categories, setCategories] = useState(initial);

  /** Add a new category */
  const addCategory = (name) => {
    if (!name.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: name.trim(), subcategories: [] },
    ]);
  };

  /** Rename an existing category */
  const renameCategory = (catId, newName) => {
    if (!newName.trim()) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, name: newName.trim() } : c))
    );
  };

  /** Delete a category (and all its subcategories) */
  const deleteCategory = (catId) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  /** Add a subcategory to an existing category */
  const addSubcategory = (catId, subName) => {
    if (!subName.trim()) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: [
                ...c.subcategories,
                { id: `sc-${Date.now()}`, name: subName.trim() },
              ],
            }
          : c
      )
    );
  };

  /** Rename a subcategory */
  const renameSubcategory = (catId, subId, newName) => {
    if (!newName.trim()) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, name: newName.trim() } : s
              ),
            }
          : c
      )
    );
  };

  /** Delete a subcategory */
  const deleteSubcategory = (catId, subId) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
          : c
      )
    );
  };

  return {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
  };
}

// ────────────────────────────────────────────────────────
// CategoriesPage – UI for managing categories with ACL and history
// ────────────────────────────────────────────────────────
export function CategoriesPage({ store }) {
  const { user, setAsAdmin, setAsUser } = useContext(UserContext);
  const [expandedId, setExpandedId] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isAdmin = user.role === 'admin';

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('http://localhost:3003/api/categories/history', {
        headers: {
          'x-user-id': user.id,
          'x-user-name': user.name,
          'x-user-role': user.role,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
    setLoadingHistory(false);
  };

  const handleAddCategory = () => {
    if (newCatName.trim() && isAdmin) {
      store.addCategory(newCatName);
      setNewCatName("");
    }
  };

  const handleAddSubcategory = (catId) => {
    if (newSubName.trim() && isAdmin) {
      store.addSubcategory(catId, newSubName);
      setNewSubName("");
      setExpandedId(null);
    }
  };

  const handleSaveEdit = (catId, subId = null) => {
    if (editingValue.trim() && isAdmin) {
      if (subId) {
        store.renameSubcategory(catId, subId, editingValue);
      } else {
        store.renameCategory(catId, editingValue);
      }
      setEditingId(null);
      setEditingValue("");
    }
  };

  const handleDeleteCategory = (catId) => {
    if (isAdmin) {
      store.deleteCategory(catId);
    }
  };

  const handleDeleteSubcategory = (catId, subId) => {
    if (isAdmin) {
      store.deleteSubcategory(catId, subId);
    }
  };

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Categories"
        subtitle="Manage categories and subcategories"
        breadcrumb={[{ label: "Dashboard", onClick: () => {} }, { label: "Categories" }]}
      />

      <div style={{ maxWidth: 1000 }}>
      {/* Header with user info and role switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>Categories</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* User Info Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: isAdmin ? "#FEF3C7" : "#E0E7FF",
            borderRadius: 6,
            fontSize: 12,
          }}>
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span style={{
              padding: "2px 8px",
              background: isAdmin ? "#F59E0B" : "#6366F1",
              color: "#fff",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
            }}>
              {user.role.toUpperCase()}
            </span>
          </div>

          {/* Role Switcher (for demo/testing) */}
          <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #E5E7EB", paddingLeft: 16 }}>
            <button
              onClick={setAsAdmin}
              style={{
                padding: "6px 12px",
                background: isAdmin ? "#1976d2" : "#F3F4F6",
                color: isAdmin ? "#000" : "#6B7280",
                border: "1px solid " + (isAdmin ? "#1976d2" : "#E5E7EB"),
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              As Admin
            </button>
            <button
              onClick={setAsUser}
              style={{
                padding: "6px 12px",
                background: !isAdmin ? "#E0E7FF" : "#F3F4F6",
                color: !isAdmin ? "#4F46E5" : "#6B7280",
                border: "1px solid " + (!isAdmin ? "#C7D2FE" : "#E5E7EB"),
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              As User
            </button>
          </div>

          {/* History Button */}
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
            style={{
              padding: "6px 12px",
              background: showHistory ? "#9333EA" : "#F3F4F6",
              color: showHistory ? "#fff" : "#6B7280",
              border: "1px solid " + (showHistory ? "#9333EA" : "#E5E7EB"),
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {!isAdmin && (
        <div style={{
          padding: 12,
          background: "#FEE2E2",
          border: "1px solid #FECACA",
          borderRadius: 8,
          color: "#991B1B",
          fontSize: 12,
          marginBottom: 24,
        }}>
          ⚠️ Read-only mode. Only admins can edit or delete categories.
        </div>
      )}

      {/* Add Category (admin only) */}
      {isAdmin && (
        <div style={{ marginBottom: 32, display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="New category name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleAddCategory}
            style={{
              padding: "10px 16px",
              background: "#1976d2",
              color: "#000",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Add Category
          </button>
        </div>
      )}

      {/* History View */}
      {showHistory && (
        <div style={{
          marginBottom: 32,
          padding: 16,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Change History</h2>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          {loadingHistory ? (
            <p style={{ color: "#6B7280", fontSize: 12 }}>Loading history...</p>
          ) : history.length === 0 ? (
            <p style={{ color: "#6B7280", fontSize: 12 }}>No changes yet.</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {history.map((change, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {change.action === 'create' ? '✨' : change.action === 'update' ? '✏️' : '🗑️'} {change.action.toUpperCase()}
                    </span>
                    <span style={{ color: "#6B7280", fontSize: 11 }}>
                      {new Date(change.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: "#6B7280" }}>
                    <strong>{change.userName}</strong> {change.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {store.categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* Category Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "#F9FAFB",
                borderBottom: expandedId === cat.id ? "1px solid #E5E7EB" : "none",
                cursor: "pointer",
              }}
              onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <span style={{ fontSize: 16 }}>{expandedId === cat.id ? "▼" : "▶"}</span>
                {editingId === cat.id && isAdmin ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSaveEdit(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #1976d2",
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 600,
                      width: 200,
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                      cursor: isAdmin ? "text" : "default",
                    }}
                    onDoubleClick={() => {
                      if (isAdmin) {
                        setEditingId(cat.id);
                        setEditingValue(cat.name);
                      }
                    }}
                  >
                    {cat.name}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {editingId === cat.id && isAdmin ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(cat.id);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#1976d2",
                        color: "#000",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#E5E7EB",
                        color: "#111827",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : isAdmin ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cat.id);
                        setEditingValue(cat.name);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#F3F4F6",
                        color: "#6B7280",
                        border: "1px solid #E5E7EB",
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#FEE2E2",
                        color: "#EF4444",
                        border: "1px solid #FECACA",
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Subcategories */}
            {expandedId === cat.id && (
              <div style={{ padding: "12px 16px", background: "#fff" }}>
                <div style={{ marginBottom: 12 }}>
                  {cat.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "#F9FAFB",
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      {editingId === sub.id && isAdmin ? (
                        <input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleSaveEdit(cat.id, sub.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          style={{
                            padding: "4px 6px",
                            border: "1px solid #1976d2",
                            borderRadius: 4,
                            fontSize: 13,
                            flex: 1,
                            fontFamily: "inherit",
                          }}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => {
                            if (isAdmin) {
                              setEditingId(sub.id);
                              setEditingValue(sub.name);
                            }
                          }}
                          style={{ cursor: isAdmin ? "text" : "default" }}
                        >
                          {sub.name}
                        </span>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        {editingId === sub.id && isAdmin ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(cat.id, sub.id)}
                              style={{
                                padding: "4px 8px",
                                background: "#1976d2",
                                color: "#000",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: "4px 8px",
                                background: "#E5E7EB",
                                color: "#111827",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(sub.id);
                                setEditingValue(sub.name);
                              }}
                              style={{
                                padding: "4px 8px",
                                background: "#F3F4F6",
                                color: "#6B7280",
                                border: "1px solid #E5E7EB",
                                borderRadius: 4,
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                              style={{
                                padding: "4px 8px",
                                background: "#FEE2E2",
                                color: "#EF4444",
                                border: "1px solid #FECACA",
                                borderRadius: 4,
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Subcategory (admin only) */}
                {isAdmin && expandedId === cat.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="New subcategory..."
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddSubcategory(cat.id)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={() => handleAddSubcategory(cat.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#1976d2",
                        color: "#000",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
  );
}