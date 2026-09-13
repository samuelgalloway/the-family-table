"use client";

import { useEffect, useState } from "react";
import { buildInstacartSearchUrl } from "../lib/instacart";

const PLATE_ICON = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="7" />
    <path d="M8 3.5c.6 1.4.2 2.4-.6 3.2M12 2.8c.2 1.5-.3 2.6-1.2 3.4M16 3.5c-.6 1.4-.2 2.4.6 3.2" />
  </svg>
);

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function palette(index) {
  return index % 2 === 0
    ? { tint: "var(--accent-tint)", color: "var(--accent-dark)" }
    : { tint: "var(--sage-tint)", color: "var(--sage-dark)" };
}

function Stepper({ view }) {
  const steps = [
    { key: "ideas", label: "Ideas" },
    { key: "recipe", label: "Cook" },
    { key: "cart", label: "Shop" },
  ];
  const order = ["ideas", "recipe", "cart"];
  const currentIndex = order.indexOf(view);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {steps.map((step, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        const bg = active || done ? "var(--accent)" : "var(--line)";
        const fg = active || done ? "white" : "var(--ink-faint)";
        const text = active ? "var(--ink)" : "var(--ink-faint)";
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 6, flexGrow: i < 2 ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, background: bg, color: fg }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: text }}>{step.label}</div>
            </div>
            {i < 2 && <div style={{ width: 24, height: 1, background: "var(--line)", flexGrow: 1 }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState("ideas");
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [selected, setSelected] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    setLoadingIdeas(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load ideas");
      setIdeas(data.ideas);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIdeas(false);
    }
  }

  function toggle(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const selectedIdeas = ideas.filter((idea) => selected[idea.id]);

  async function handleViewRecipes() {
    setLoadingRecipes(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas: selectedIdeas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate recipes");
      setRecipes(data.recipes);
      setRecipeIndex(0);
      setView("recipe");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRecipes(false);
    }
  }

  async function handleGetShoppingList() {
    setLoadingCart(true);
    setError(null);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: recipes.map((r, i) => ({ ...r, tag: selectedIdeas[i]?.tag })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not build shopping list");
      setCategories(data.categories);
      setView("cart");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCart(false);
    }
  }

  function startOver() {
    setSelected({});
    setRecipes([]);
    setRecipeIndex(0);
    setCategories([]);
    setView("ideas");
    loadIdeas();
  }

  const currentRecipe = recipes[recipeIndex];
  const isFirst = recipeIndex === 0;
  const isLast = recipeIndex >= recipes.length - 1;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "22px 20px 16px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
              The Family Table
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 500 }}>Serves 4</div>
          </div>
          <Stepper view={view} />
        </div>

        {error && (
          <div style={{ margin: "16px 20px 0", padding: "12px 14px", background: "var(--accent-tint)", color: "var(--accent-dark)", borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        {view === "ideas" && (
          <>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "18px 20px 8px" }}>
                <div className="display" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>
                  This week&rsquo;s ideas
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  Pick a few for the week &mdash; tap a card to add it.
                </div>
              </div>

              {loadingIdeas && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 13 }}>
                  Dreaming up dinner ideas&hellip;
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 20px 100px" }}>
                {ideas.map((idea, i) => {
                  const p = palette(i);
                  const checked = !!selected[idea.id];
                  return (
                    <div
                      key={idea.id}
                      onClick={() => toggle(idea.id)}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "stretch",
                        background: "var(--surface)",
                        border: `1px solid ${checked ? "var(--accent)" : "var(--line)"}`,
                        borderRadius: 14,
                        padding: 14,
                        boxShadow: "0 1px 2px oklch(20% 0 0 / 0.04)",
                      }}
                    >
                      <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, background: p.tint, display: "flex", alignItems: "center", justifyContent: "center", color: p.color }}>
                        {PLATE_ICON}
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{idea.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>{idea.tagline}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: p.color, background: p.tint, padding: "2px 8px", borderRadius: 999 }}>{idea.tag}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-faint)", alignSelf: "center" }}>{idea.time}</span>
                        </div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: 999, border: `1.5px solid ${checked ? "var(--accent)" : "var(--line)"}`, background: checked ? "var(--accent)" : "var(--surface)", flexShrink: 0, alignSelf: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && CHECK_ICON}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "var(--surface)", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", flexGrow: 1 }}>{selectedIdeas.length} selected</div>
              <button
                onClick={handleViewRecipes}
                disabled={selectedIdeas.length === 0 || loadingRecipes}
                style={{
                  background: selectedIdeas.length === 0 ? "var(--line)" : "var(--accent)",
                  color: selectedIdeas.length === 0 ? "var(--ink-faint)" : "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {loadingRecipes ? "Writing recipes…" : "View recipes"}
              </button>
            </div>
          </>
        )}

        {view === "recipe" && currentRecipe && (
          <>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 4px" }}>
                <button onClick={() => setView("ideas")} style={{ background: "none", border: "none", padding: "6px 0", fontSize: 13, fontWeight: 500, color: "var(--ink-soft)" }}>
                  &larr; Ideas
                </button>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 500 }}>
                  Recipe {recipeIndex + 1} of {recipes.length}
                </div>
              </div>

              <div style={{ padding: "8px 20px 24px" }}>
                <div style={{ height: 150, borderRadius: 16, background: palette(recipeIndex).tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: palette(recipeIndex).color }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="14" r="7" />
                    <path d="M8 3.5c.6 1.4.2 2.4-.6 3.2M12 2.8c.2 1.5-.3 2.6-1.2 3.4M16 3.5c-.6 1.4-.2 2.4.6 3.2" />
                  </svg>
                </div>

                <div className="display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, lineHeight: 1.2 }}>
                  {currentRecipe.title}
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>&#9201; {currentRecipe.time}</span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Serves {currentRecipe.servings || 4}</span>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                    Ingredients
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentRecipe.ingredients.map((ing, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                        <div style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                    Steps
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {currentRecipe.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 999, background: "var(--accent-tint)", color: "var(--accent-dark)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.55, paddingTop: 2 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "var(--surface)", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
              <button
                onClick={() => setRecipeIndex((i) => Math.max(0, i - 1))}
                disabled={isFirst}
                style={{ background: "var(--bg)", color: isFirst ? "var(--ink-faint)" : "var(--ink-soft)", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}
              >
                Back
              </button>
              <button
                onClick={() => (isLast ? handleGetShoppingList() : setRecipeIndex((i) => i + 1))}
                disabled={loadingCart}
                style={{ flexGrow: 1, background: "var(--accent)", color: "white", border: "none", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}
              >
                {loadingCart ? "Building list…" : isLast ? "Get shopping list" : "Next recipe"}
              </button>
            </div>
          </>
        )}

        {view === "cart" && (
          <>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "18px 20px 8px" }}>
                <div className="display" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>
                  Shopping list
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  {categories.reduce((n, c) => n + c.items.length, 0)} items to buy, combined across {recipes.length} recipes. Tap one to search it on Instacart.
                </div>
              </div>

              <div style={{ padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                {categories.map((category, i) => (
                  <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                      {category.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {category.items.map((ing, j) => (
                        <a
                          key={j}
                          href={buildInstacartSearchUrl(ing)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--ink-soft)" }}
                        >
                          <div style={{ width: 5, height: 5, borderRadius: 999, background: "var(--sage)", flexShrink: 0 }} />
                          <span style={{ flexGrow: 1 }}>{ing}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--instacart-dark)", flexShrink: 0 }}>Shop &rarr;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "sticky", bottom: 0, padding: "14px 20px", background: "var(--surface)", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setView("recipe")} style={{ background: "var(--bg)", color: "var(--ink-soft)", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                Back
              </button>
              <button onClick={startOver} style={{ background: "none", border: "none", padding: 4, fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 500, textDecoration: "underline" }}>
                Start a new week
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
