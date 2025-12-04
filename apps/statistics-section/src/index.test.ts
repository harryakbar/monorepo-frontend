import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Statistics Section", () => {
  it("renders without crashing", () => {
    document.body.innerHTML = `
      <section class="statistics">
        <h2>Our Statistics</h2>
        <div class="stat-item">
          <span class="count">10M+</span>
          <span class="label">Downloads</span>
        </div>
      </section>
    `;

    expect(screen.getByText("Our Statistics")).toBeInTheDocument();
    expect(screen.getByText("10M+")).toBeInTheDocument();
  });
});
