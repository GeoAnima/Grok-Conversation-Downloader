// ==UserScript==
// @name         Grok Conversation Downloader
// @namespace    https://github.com/GeoAnima/Grok-Conversation-Downloader/
// @version      2.0
// @author       Geo_Anima
// @description  Downloads Grok conversations as JSON or PDF
// @match        https://grok.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// @require      https://cdn.jsdelivr.net/npm/marked@4.0.0/lib/marked.min.js
// @require      https://cdn.jsdelivr.net/npm/pdfkit@0.16.0/js/pdfkit.standalone.js
// @require      https://cdn.jsdelivr.net/npm/blob-stream@0.1.3/.js
// ==/UserScript==

(function() {
    'use strict';

    // --- Scrape Messages from Conversation ---
    // Extracts messages by clicking copy buttons and reading clipboard content.
    // Relies on Grok's UI structure where direct DOM access to messages is limited.
    async function scrapeMessages() {
        const messageRows = Array.from(document.querySelectorAll('div.message-row.items-end, div.message-row.items-start'));
        const messages = [];

        for (const row of messageRows) {
            const copyButton = row.querySelector('button[class*="inline-flex"][class*="h-8"][class*="w-8"]:has(svg.lucide-copy)');
            if (!copyButton) continue;

            const isUser = row.classList.contains('items-end');
            const role = isUser ? 'user' : 'assistant';
            copyButton.click();
            try {
                const content = await navigator.clipboard.readText();
                if (content) messages.push({ role, content: content.trim() });
            } catch (err) {
                console.error('Clipboard read failed:', err);
            }
        }
        return messages;
    }

    // --- Download as JSON ---
    // Saves the conversation as a formatted JSON file.
    async function onDownloadJsonClick() {
        const messages = await scrapeMessages();
        if (!messages.length) {
            alert('No conversation data found');
            return;
        }
        const data = { messages };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grok_conversation_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- Format Messages for PDF ---
    // Parses Markdown content and styles it for PDF output using PDFKit.
    function formatMessageForPDF(doc, msg) {
        const label = msg.role === 'user' ? 'User:' : 'Assistant:';
        const color = msg.role === 'user' ? 'blue' : 'red';
        const align = msg.role === 'user' ? 'left' : 'left';

        // Style the role label
        doc.fontSize(12).font('Helvetica-Bold').fillColor(color).text(label, { align });
        doc.font('Helvetica').fillColor('black').moveDown(0.5);

        // Parse Markdown into tokens
        let tokens;
        try {
            tokens = marked.lexer(msg.content);
        } catch (err) {
            console.error('Markdown parsing error:', err);
            doc.fontSize(12).font('Helvetica').text(msg.content); // Fallback to plain text
            return;
        }

        // Style each Markdown token
        tokens.forEach(token => {
            switch (token.type) {
                case 'heading':
                    doc.fontSize(16 - token.depth).font('Helvetica-Bold').text(token.text);
                    break;
                case 'paragraph':
                    doc.fontSize(12).font('Helvetica').text(token.text);
                    break;
                case 'list':
                    token.items.forEach(item => {
                        doc.fontSize(12).font('Helvetica').text(`• ${item.text}`);
                    });
                    break;
                case 'code':
                    doc.fontSize(10).font('Courier').text(token.text, { indent: 20 });
                    break;
                case 'blockquote':
                    doc.fontSize(12).font('Helvetica-Oblique').text(token.text, { indent: 20 });
                    break;
                case 'hr':
                    doc.moveDown(0.5)
                       .lineWidth(1)
                       .strokeColor('gray')
                       .dash(5, { space: 5 })
                       .moveTo(50, doc.y)
                       .lineTo(550, doc.y)
                       .stroke()
                       .undash();
                    break;
                default:
                    doc.fontSize(12).font('Helvetica').text(token.text || '');
                    break;
            }
            doc.moveDown(0.25);
        });

        doc.moveDown(1.5);
    }

    // --- Download as PDF ---
    // Creates a PDF file of the conversation with proper formatting.
    async function onDownloadPdfClick() {
        if (typeof marked === 'undefined' || typeof PDFDocument === 'undefined' || typeof blobStream === 'undefined') {
            alert('Error: Required libraries failed to load. Check your connection or UserScript manager.');
            return;
        }
        const messages = await scrapeMessages();
        if (!messages.length) {
            alert('No conversation data found');
            return;
        }

        // Set up PDF document
        const doc = new PDFDocument({ margin: 50, autoFirstPage: false });
        const stream = doc.pipe(blobStream());

        // Add title page
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('Grok Conversation', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Format and add messages
        messages.forEach(msg => formatMessageForPDF(doc, msg));

        // Finalize and trigger download
        doc.end();
        stream.on('finish', () => {
            const blob = stream.toBlob('application/pdf');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grok_conversation_${Date.now()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // --- Insert Download Buttons ---
    // Adds JSON and PDF buttons beside the "New Chat" button, styled to match the UI.
    function insertButtonsLeftOfNewChat(container) {
        const newChatBtn = container.querySelector('a[href="/chat"]');

        const jsonBtn = document.createElement('button');
        jsonBtn.textContent = 'Download JSON';
        jsonBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-default text-primary hover:bg-button-ghost-hover h-10 w-auto px-3 rounded-full';
        jsonBtn.addEventListener('click', onDownloadJsonClick);

        const pdfBtn = document.createElement('button');
        pdfBtn.textContent = 'Download PDF';
        pdfBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-default text-primary hover:bg-button-ghost-hover h-10 w-auto px-3 rounded-full';
        pdfBtn.addEventListener('click', onDownloadPdfClick);

        if (newChatBtn) {
            container.insertBefore(jsonBtn, newChatBtn);
            container.insertBefore(pdfBtn, newChatBtn);
        } else {
            container.prepend(jsonBtn, pdfBtn);
        }
    }

    // --- DOM Observation for Button Placement ---
    // Watches for the navigation container to insert buttons once it’s available.
    const observer = new MutationObserver(() => {
        const container = document.querySelector('.absolute.flex.flex-row.items-center.gap-0\\.5.ml-auto.end-3') ||
                         document.querySelector('.absolute.flex.flex-row.items-center.ml-auto.end-3');
        if (container && !buttonInserted) {
            insertButtonsLeftOfNewChat(container);
            buttonInserted = true;
            observer.disconnect();
        }
    });

    let buttonInserted = false;
    observer.observe(document, { childList: true, subtree: true });
})();
