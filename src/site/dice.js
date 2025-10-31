    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const TOAST_DURATION_MS = 2000;
            const toastContainer = document.getElementById('toast-container');

            /**
             * Handles the actual dice rolling logic.
             * @param {string} formula - The raw dice notation (e.g., "4d6+2", "+3", "d20").
             * @returns {{formula: string, result: number|string, details: string}} The roll result object.
             */
            function rollDice(formula) {
                // Remove spaces and normalize 'D' to 'd'
                formula = formula.trim().toLowerCase().replace(/\s/g, '');

                // Regular expression to capture dice rolls: XdY[+|-Z]
                let match = formula.match(/(\d*)d(\d+)([+-]\d+)?/);

                if (match) {
                    // Case 1: XdY is present (e.g., '4d6', 'd20', '2d8+3')
                    const numDice = parseInt(match[1] || '1'); // 'd6' means 1d6
                    const dieSize = parseInt(match[2]);
                    const modifier = parseInt(match[3] || '0');

                    if (dieSize <= 1) {
                         return { formula, result: 'Error', details: 'Dice size must be > 1.' };
                    }
                    if (numDice > 100) {
                         return { formula, result: 'Error', details: 'Max 100 dice allowed.' };
                    }


                    let total = 0;
                    let rolls = [];

                    for (let i = 0; i < numDice; i++) {
                        const roll = Math.floor(Math.random() * dieSize) + 1;
                        total += roll;
                        rolls.push(roll);
                    }

                    const rollTotal = total;
                    total += modifier;

                    const modStr = modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '';
                    const details = `[${rolls.join(' + ')}]${modStr} = ${total}`;
                    return { formula: formula, result: total, details };

                } else if (match = formula.match(/([+-]\d+)/)) {
                    // Case 2: Modifier only (+N or -N). Default to 1d20.
                    const modifier = parseInt(match[1]);
                    const dieSize = 20;
                    const roll = Math.floor(Math.random() * dieSize) + 1;
                    const total = roll + modifier;

                    const modStr = modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
                    const details = `1d20 (${roll}) ${modStr} = ${total}`;
                    return { formula: formula, result: total, details: `(1d20) ${details}` };

                }

                return { formula, result: 'Error', details: 'Invalid formula' };
            }

            /**
             * Creates and displays a transient toast message.
             * @param {string} formula - The original formula clicked.
             * @param {string} result - The final calculated result.
             * @param {string} details - Detailed breakdown of the roll.
             */
            function showToast(formula, result, details) {
                // 1. Create the toast element
                const toast = document.createElement('div');
                toast.className = 'toast-message bg-white dark:bg-gray-700 p-3 rounded-lg shadow-2xl border-2 border-indigo-500 w-64 text-center';
                
                let toastContent;

                if (result === 'Error') {
                    toastContent = `
                        <p class="text-sm font-bold text-red-500">Error</p>
                        <p class="text-xs text-red-400">${details}</p>
                    `;
                } else {
                    toastContent = `
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">${formula}</p>
                        <p class="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">${result}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 whitespace-pre-wrap">${details.replace('=', 'Total:')}</p>
                    `;
                }

                toast.innerHTML = toastContent;
                toastContainer.appendChild(toast);

                // 2. Show the toast with a slight delay for transition
                setTimeout(() => {
                    toast.classList.add('show');
                }, 10);

                // 3. Hide and remove after duration
                setTimeout(() => {
                    toast.classList.remove('show');
                    // Remove after transition finishes
                    setTimeout(() => {
                        toast.remove();
                    }, 300); 
                }, TOAST_DURATION_MS);
            }

            /**
             * Safely finds dice notation in text nodes and wraps them in spans.
             * Uses TreeWalker to traverse only text nodes, avoiding disruption of HTML structure.
             * @param {Node} node - The starting DOM node to scan (usually document.body).
             */
            function findAndWrapDiceNotations(node) {
                // Regex: Captures XdY[+|-Z] OR [+][-Z]. Uses word boundaries for safety.
                const diceRegex = /(\b\d*[dD]\d+([+-]\s*\d+)?\b|\b[+-]\s*\d+\b)/g;

                const walker = document.createTreeWalker(
                    node,
                    NodeFilter.SHOW_TEXT,
                    // Filter out nodes that are within script, style, or already processed elements
                    { acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || parent.closest('.dice-roller') || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                            return NodeFilter.FILTER_SKIP;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }},
                    false
                );

                let currentNode;

                // Iterate through all text nodes
                while (currentNode = walker.nextNode()) {
                    const text = currentNode.nodeValue;
                    if (diceRegex.test(text)) {
                        // Reset regex for replacement function
                        diceRegex.lastIndex = 0;

                        // Use string.replace with a function to insert the HTML span
                        const newContent = text.replace(diceRegex, (match) => {
                            // Match is trimmed and stored in a data attribute
                            const formula = match.trim().replace(/\s/g, '');
                            return `<span 
                                class="dice-roller font-mono font-bold text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900 px-1 py-0.5 rounded-md cursor-pointer transition duration-150 ease-in-out hover:bg-indigo-300 dark:hover:bg-indigo-700 active:ring-2 active:ring-indigo-500 active:scale-95" 
                                data-formula="${formula}"
                            >${match}</span>`;
                        });

                        // Create a temporary container to hold the HTML structure
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = newContent;

                        // Replace the original text node with the new content
                        while (tempDiv.firstChild) {
                            currentNode.parentNode.insertBefore(tempDiv.firstChild, currentNode);
                        }

                        // Remove the original text node
                        currentNode.parentNode.removeChild(currentNode);
                    }
                }
            }

            // 4. Run the scanner on the main content area
            findAndWrapDiceNotations(document.getElementById('content'));

            // 5. Set up the global click listener using event delegation
            document.body.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('dice-roller')) {
                    const formula = target.dataset.formula;
                    if (formula) {
                        const result = rollDice(formula);
                        showToast(result.formula, result.result, result.details);
                    }
                }
            });
        });
    </script>
