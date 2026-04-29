import { useState } from "react";

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