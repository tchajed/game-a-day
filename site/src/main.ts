import "./style.css";
import { games } from "./generated-games";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const cards = games
  .map(
    (game) => `
      <details class="game-card">
        <summary>
          <img src="${game.cover}" alt="Cropped artwork from ${game.title}" />
          <div class="game-card__heading">
            <div>
              <time datetime="${game.date}">${formatDate(game.date)}</time>
              <h2>${game.title}</h2>
            </div>
            <span class="toggle" aria-hidden="true"></span>
          </div>
        </summary>
        <div class="game-card__description">
          <p><strong>${game.hook}</strong> ${game.description}</p>
          <a href="/${game.slug}/">Play ${game.title} <span aria-hidden="true">↗</span></a>
        </div>
      </details>`,
  )
  .join("");

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <header>
    <h1>One game a day</h1>
    <p>Each game was built in one day. GPT 5.6 Sol did most of the work.</p>
  </header>
  <main class="game-grid">${cards}</main>
`;
