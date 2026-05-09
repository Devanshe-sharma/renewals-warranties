import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [expandedId, setExpandedId] = useState(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);

  const [editingValue, setEditingValue] = useState("");

  // ─────────────────────────────────────────────
  // Fetch Categories
  // ─────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ─────────────────────────────────────────────
  // Add Category
  // ─────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const res = await fetch(`${API}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategory.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewCategory("");
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Rename Category
  // ─────────────────────────────────────────────
  const handleRenameCategory = async (id) => {
    if (!editingValue.trim()) return;

    try {
      const res = await fetch(`${API}/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingValue.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditingCategoryId(null);
        setEditingValue("");
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Delete Category
  // ─────────────────────────────────────────────
  const handleDeleteCategory = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this category?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API}/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Add Subcategory
  // ─────────────────────────────────────────────
  const handleAddSubcategory = async (categoryId) => {
    if (!newSubcategory.trim()) return;

    try {
      const res = await fetch(
        `${API}/api/categories/${categoryId}/subcategories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newSubcategory.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setNewSubcategory("");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Rename Subcategory
  // ─────────────────────────────────────────────
  const handleRenameSubcategory = async (
    categoryId,
    subcategoryId
  ) => {
    if (!editingValue.trim()) return;

    try {
      const res = await fetch(
        `${API}/api/categories/${categoryId}/subcategories/${subcategoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingValue.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setEditingSubcategoryId(null);
        setEditingValue("");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Delete Subcategory
  // ─────────────────────────────────────────────
  const handleDeleteSubcategory = async (
    categoryId,
    subcategoryId
  ) => {
    const confirmDelete = window.confirm(
      "Delete this subcategory?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API}/api/categories/${categoryId}/subcategories/${subcategoryId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Categories"
        subtitle="Manage Categories"
        breadcrumb={[
          { label: "Dashboard", onClick: () => {} },
          { label: "Categories" },
        ]}
      />

      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: 20,
        }}
      >
        {/* Add Category */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <input
            type="text"
            placeholder="New category name..."
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value)
            }
            style={inputStyle}
          />

          <button
            onClick={handleAddCategory}
            style={addBtn}
          >
            Add Category
          </button>
        </div>

        {/* Categories */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat._id}
              style={card}
            >
              {/* Header */}
              <div
                style={header}
                onClick={() =>
                  setExpandedId(
                    expandedId === cat._id
                      ? null
                      : cat._id
                  )
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span>
                    {expandedId === cat._id
                      ? "▼"
                      : "▶"}
                  </span>

                  {editingCategoryId === cat._id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) =>
                        setEditingValue(
                          e.target.value
                        )
                      }
                      style={editInput}
                    />
                  ) : (
                    <span style={titleStyle}>
                      {cat.name}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  {editingCategoryId === cat._id ? (
                    <>
                      <button
                        style={saveBtn}
                        onClick={() =>
                          handleRenameCategory(
                            cat._id
                          )
                        }
                      >
                        Save
                      </button>

                      <button
                        style={cancelBtn}
                        onClick={() => {
                          setEditingCategoryId(
                            null
                          );
                          setEditingValue("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={editBtn}
                        onClick={() => {
                          setEditingCategoryId(
                            cat._id
                          );
                          setEditingValue(
                            cat.name
                          );
                        }}
                      >
                        Edit
                      </button>

                      <button
                        style={deleteBtn}
                        onClick={() =>
                          handleDeleteCategory(
                            cat._id
                          )
                        }
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Subcategories */}
              {expandedId === cat._id && (
                <div style={body}>
                  {(cat.subcategories || []).map(
                    (sub) => (
                      <div
                        key={sub._id}
                        style={subRow}
                      >
                        {editingSubcategoryId ===
                        sub._id ? (
                          <input
                            autoFocus
                            value={editingValue}
                            onChange={(e) =>
                              setEditingValue(
                                e.target.value
                              )
                            }
                            style={editInput}
                          />
                        ) : (
                          <span>
                            {sub.name}
                          </span>
                        )}

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          {editingSubcategoryId ===
                          sub._id ? (
                            <>
                              <button
                                style={saveBtn}
                                onClick={() =>
                                  handleRenameSubcategory(
                                    cat._id,
                                    sub._id
                                  )
                                }
                              >
                                Save
                              </button>

                              <button
                                style={
                                  cancelBtn
                                }
                                onClick={() => {
                                  setEditingSubcategoryId(
                                    null
                                  );
                                  setEditingValue(
                                    ""
                                  );
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                style={
                                  editBtn
                                }
                                onClick={() => {
                                  setEditingSubcategoryId(
                                    sub._id
                                  );
                                  setEditingValue(
                                    sub.name
                                  );
                                }}
                              >
                                Edit
                              </button>

                              <button
                                style={
                                  deleteBtn
                                }
                                onClick={() =>
                                  handleDeleteSubcategory(
                                    cat._id,
                                    sub._id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Add Subcategory */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="New subcategory..."
                      value={newSubcategory}
                      onChange={(e) =>
                        setNewSubcategory(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    />

                    <button
                      style={addBtn}
                      onClick={() =>
                        handleAddSubcategory(
                          cat._id
                        )
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* Styles */
/* ───────────────────────────────────────────── */

const card = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
};

const header = {
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#F9FAFB",
  cursor: "pointer",
};

const body = {
  padding: 16,
};

const titleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const subRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  background: "#F9FAFB",
  borderRadius: 8,
  marginBottom: 8,
};

const inputStyle = {
  flex: 1,
  padding: "10px 14px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
};

const editInput = {
  padding: "8px 10px",
  border: "1px solid #1976d2",
  borderRadius: 6,
  fontSize: 14,
  outline: "none",
};

const addBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 8,
  background: "#1976d2",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const editBtn = {
  padding: "6px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 12px",
  border: "1px solid #FECACA",
  borderRadius: 6,
  background: "#FEE2E2",
  color: "#DC2626",
  cursor: "pointer",
};

const saveBtn = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
};

const cancelBtn = {
  padding: "6px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};