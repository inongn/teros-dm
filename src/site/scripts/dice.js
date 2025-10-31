        (function() {
            // Define the regular expression to find dice notation: (N)d(S)(+\/-(M))
            // Group 1: (\d*) -> Dice Count (N, optional, e.g., '3' in '3d6')
            // Group 2: (\d+) -> Sides (S, mandatory, e.g., '6' in '3d6')
            // Group 3: ([\+\-]\d+)? -> Modifier (M, optional, e.g., '+2' or '-1')
            const diceRegex = /(\d*)[dD](\d+)([\+\-]\d+)?/g;

            // --- Utility Functions ---

            /**
             * Parses a dice notation string and calculates the roll result.
             * @param {string} notation - The dice notation string (e.g., "2d6+3").
             * @returns {{formula: string, result: number}} The detailed result.
             */
            function rollDice(notation) {
                // Reset regex execution index
                diceRegex.lastIndex = 0;
                const match = diceRegex.exec(notation);

                if (!match) {
                    return { formula: "Error: Invalid Notation", result: 0 };
                }

                // Extract components
                let diceCount = parseInt(match[1]) || 1; // Default to 1 if count is not specified (e.g., 'd20')
                const sides = parseInt(match[2]);
                const modifierStr = match[3] || '';
                const modifier = parseInt(modifierStr) || 0;

                let totalRoll = 0;
                let rollDetails = [];

                // Perform the rolls
                for (let i = 0; i < diceCount; i++) {
                    // Roll is inclusive: Math.floor(Math.random() * max) + 1
                    const roll = Math.floor(Math.random() * sides) + 1;
                    totalRoll += roll;
                    rollDetails.push(roll);
                }

                // Calculate final result
                const finalResult = totalRoll + modifier;

                // Construct a descriptive formula string
                let formula = notation + " = ";
                if (rollDetails.length > 1) {
                    formula += "(" + rollDetails.join(' + ') + ")";
                } else if (rollDetails.length === 1) {
                    formula += rollDetails[0];
                }

                if (modifier !== 0) {
                    formula += (modifier > 0 ? " + " : " - ") + Math.abs(modifier);
                }
                formula += " = " + finalResult;

                return { formula, result: finalResult };
            }

            /**
             * Displays a transient toast notification with the roll result.
             * @param {string} notation - The original dice notation.
             * @param {string} formula - The detailed formula string.
             * @param {number} result - The final numerical result.
             */
            function showToast(notation, formula, result) {
                const container = document.getElementById('toast-container');
                const toast = document.createElement('div');
                toast.className = 'toast-message bg-white text-gray-800 border-l-4 border-primary';

                toast.innerHTML = `
                    <p class="font-bold text-lg mb-1">${notation} Roll</p>
                    <p class="text-2xl font-extrabold text-primary mb-1">${result}</p>
                    <p class="text-sm text-gray-600">${formula}</p>
                `;

                // Add to container
                container.appendChild(toast);

                // Wait a moment for the reflow before starting the transition
                setTimeout(() => {
                    toast.classList.add('show');
                }, 10);

                // Auto-hide after 5 seconds
                const duration = 5000;
                setTimeout(() => {
                    toast.classList.remove('show');
                    // Remove from DOM after transition finishes (0.5s)
                    setTimeout(() => {
                        container.removeChild(toast);
                    }, 500);
                }, duration);
            }

            // --- DOM Manipulation and Setup ---

            /**
             * Attaches the click listener to all .dice-roller elements.
             */
            function initEventListeners() {
                document.querySelectorAll('.dice-roller').forEach(span => {
                    span.addEventListener('click', (event) => {
                        // Prevent click from propagating up to parent elements
                        event.stopPropagation();

                        const notation = span.textContent.trim();
                        const roll = rollDice(notation);

                        showToast(notation, roll.formula, roll.result);
                    });
                });
            }

            /**
             * Traverses the body and wraps all found dice notations in a clickable span.
             */
            function wrapDiceNotation() {
                // Use a TreeWalker to efficiently find all non-empty text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    // Filter function to skip script and style tags, and already wrapped text
                    { acceptNode: (node) => {
                        const parentTag = node.parentNode.tagName;
                        if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || node.parentNode.classList.contains('dice-roller')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // Only accept non-empty text nodes that contain dice notation
                        if (node.nodeValue.trim() !== '' && diceRegex.test(node.nodeValue)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    }},
                    false
                );

                const textNodesToReplace = [];
                let currentNode;
                while (currentNode = walker.nextNode()) {
                    textNodesToReplace.push(currentNode);
                }

                textNodesToReplace.forEach(textNode => {
                    const originalText = textNode.nodeValue;

                    // Use replace to find and wrap the dice notation
                    const newHtml = originalText.replace(diceRegex, (match) => {
                        // We replace the matched text with a span wrapper
                        return `<span class="dice-roller">${match}</span>`;
                    });

                    // Create a temporary container element to hold the new DOM structure
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = newHtml;

                    // Replace the original text node with the content of the temporary container
                    textNode.parentNode.insertBefore(tempDiv, textNode);

                    // Move all children of the tempDiv (the text and spans) into the parent
                    while (tempDiv.firstChild) {
                        textNode.parentNode.insertBefore(tempDiv.firstChild, tempDiv);
                    }

                    // Remove the temporary container and the original text node
                    textNode.parentNode.removeChild(tempDiv);
                    textNode.parentNode.removeChild(textNode);
                });
            }

            // --- Initialization ---

            document.addEventListener('DOMContentLoaded', () => {
                // 1. Wrap the notation in spans
                wrapDiceNotation();
                // 2. Attach click handlers to the new spans
                initEventListeners();
            });
        })();
