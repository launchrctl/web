import { LitElement, html, css } from 'lit';
import "@jsfe/shoelace";
import "@shoelace-style/shoelace";

class ActionDisplay extends LitElement {
  static properties = {
    action: { type: Object },
    additionalDetails: { type: Object },
  };

  static styles = css`
    /* Add your styles for action-display here */
    .action-container {
      border: 1px solid #ddd;
      padding: 10px;
      margin: 5px;
    }
  `;

  // Fetch additional details when the action changes
  updated(changedProperties) {
    if (changedProperties.has('action') && this.action) {
      this.fetchAdditionalDetails();
    }
  }

  async fetchAdditionalDetails() {
    try {
      const response = await fetch(`http://localhost:8080/api/actions/${this.action.id}`);
      if (!response.ok) {
        throw new Error(response.status);
      }
      this.additionalDetails = await response.json();
    } catch (error) {
      console.error('Error fetching additional details:', error);
    }
  }

  render() {
    return html`
      <div class="action-container">
        <h2>${this.action.title}</h2>
        <p>${this.action.description}</p>
        <p>ID: ${this.action.id}</p>
        <sl-details summary="View action">
          <pre><code>${JSON.stringify(this.additionalDetails, null, 2)}</code></pre>
        </sl-details>
        ${this.additionalDetails?.jsonschema?.properties?.arguments?.properties
          ? html`
            <jsf-shoelace
              .schema=${{
                type: "object",
                properties: this.additionalDetails?.jsonschema?.properties?.arguments?.properties
              }}
            ></jsf-shoelace>
          `
          : html`<p>source</p>`
        }
        ${this.additionalDetails?.jsonschema?.properties?.options?.properties
          ? html`
            <jsf-shoelace
              .schema=${{
                type: "object",
                properties: this.additionalDetails?.jsonschema?.properties?.options?.properties
              }}
            ></jsf-shoelace>
          `
          : html`<p>source</p>`
        }
      </div>
    `;
  }
}

customElements.define('action-display', ActionDisplay);
