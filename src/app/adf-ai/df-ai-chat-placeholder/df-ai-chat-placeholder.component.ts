import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'df-ai-chat-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coming-soon-container">
      <h2>Chat with Your Data</h2>
      <p>
        Conversational AI interface to query your databases using natural
        language. Powered by AI providers and MCP tools.
      </p>
      <p class="status"><em>Coming soon</em></p>
    </div>
  `,
  styles: [
    `
      .coming-soon-container {
        padding: 3rem 2rem;
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
      }
      h2 {
        margin-bottom: 1rem;
      }
      .status {
        margin-top: 1.5rem;
        color: #888;
      }
    `,
  ],
})
export class DfAiChatPlaceholderComponent {}
