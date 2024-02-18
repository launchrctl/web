import { LitElement, css, html } from 'lit';
import { Task } from '@lit/task';

import './action-display.js'; // Adjust the path based on your project structure

// Create the ActionsList component
class ActionsList extends LitElement {
  static properties = {
    actions: { type: Array },
    active: { type: String },
  };

  constructor() {
    super();
    this.actions = [];
    this.active = '';
  }

  // Define a Task for fetching actions
  _fetchActionsTask = new Task(this, {
    task: async () => {
      const response = await fetch('http://localhost:8080/api/actions');
      if (!response.ok) {
        throw new Error(response.status);
      }
      this.actions = await response.json();
    },
    args: () => [],
  });

  setActive(id) {
    this.active = id;
  }

  render() {
    const activeAction = this.actions.find((action) => action.id === this.active);
    return html`
      <div class="card">
        ${this._fetchActionsTask.render({
          pending: () => html`<p>Loading actions...</p>`,
          complete: (actions) => html`
            <ul>
              ${this.actions.map(
                (action) => html`
                  <li @click=${() => this.setActive(action.id)}>
                    <strong>${action.title}</strong>
                    ${action.id}
                  </li>
                `
              )}
            </ul>
            ${activeAction
              ? html`<action-display .action=${activeAction}></action-display>`
              : html`<p>No active action selected</p>`}
          `,
          error: (e) => html`<p>Error: ${e}</p>`,
        })}
      </div>
    `;
  }

  static styles = css`
    /* Add your styles for ActionsList here */
    body {
      font-family: sans-serif;
    }
    .card {
      height: 100vh;
      width: 100vw;
      align-items: start;
      display: grid;
      grid-template-columns: 400px 1fr;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      cursor: pointer;
      padding: 5px;
      margin: 5px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
    }
    li:hover {
      background-color: #e0e0e0;
    }
  `;
}

customElements.define('actions-list', ActionsList);
