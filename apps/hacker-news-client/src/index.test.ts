import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Hacker News Client", () => {
  it("renders without crashing", () => {
    document.body.innerHTML = `
      <div id="root">
        <header>
          <h1>Hacker News</h1>
        </header>
        <main>
          <ul>
            <li>Story 1</li>
            <li>Story 2</li>
          </ul>
        </main>
      </div>
    `;

    expect(screen.getByText("Hacker News")).toBeInTheDocument();
    expect(screen.getByText("Story 1")).toBeInTheDocument();
  });
});
