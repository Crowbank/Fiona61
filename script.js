// Function to convert an address into a Google Maps search link
function generateMapLink(address) {
    const baseUrl = "https://www.google.com/maps/search/?api=1&query=";
    return baseUrl + encodeURIComponent(address);
}

// Function to fetch selected activity for a slot
async function fetchSelectedActivity(slot) {
    try {
        const response = await fetch(`https://rota.crowbank.uk/api/fiona61?slot=${slot}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const choice = data.choice;
        console.log(`Successfully retrieved data for ${slot}: ${choice}`);
        return choice;
    } catch (error) {
        console.error(`Failed to fetch data for ${slot}: ${error.message}`);
        return null;
    }
}

// Function to generate HTML for each section
async function generateSection(sectionTitle, items) {
    const section = document.createElement('div');
    section.classList.add('section');
    section.innerHTML = `<h2>${sectionTitle}</h2>`;

    // Fetch the selected activity for this section
    const selectedActivity = await fetchSelectedActivity(sectionTitle.toLowerCase());

    // Sort items to ensure "No Activity" is first and "Custom Activity" is last
    items.sort((a, b) => {
        if (a.isNoActivity) return -1;
        if (b.isNoActivity) return 1;
        if (a.isCustom) return 1;
        if (b.isCustom) return -1;
        return 0;
    });

    items.forEach((item, index) => {
        const optionContainer = document.createElement('div');
        optionContainer.classList.add('option-container');
        optionContainer.dataset.section = sectionTitle;
        optionContainer.dataset.name = item.name;

        if (item.isNoActivity || item.isCustom) {
            optionContainer.classList.add('small-option');
            let optionContent = `
                <h3>${item.icon ? `<i class="${item.icon}"></i>` : ''} ${item.title}</h3>
            `;
            if (item.isCustom) {
                optionContent += `
                    <p>${item.description}</p>
                    <textarea class="custom-input" placeholder="Enter your custom plan"></textarea>
                    <button class="save-button">Save</button>
                `;
            }
            optionContainer.innerHTML = optionContent;
        } else {
            const isEven = index % 2 === 0;
            optionContainer.innerHTML = `
                <h3>${item.title}</h3>
                <div class="option ${isEven ? '' : 'reverse'}">
                    <div class="content">
                        <p>${item.description}</p>
                        <p class="address"><a href="${generateMapLink(item.address)}" target="_blank">${item.address}</a></p>
                    </div>
                    <a href="${item.link}" target="_blank" class="image-container">
                        <img src="${item.imgSrc}" alt="${item.title}">
                    </a>
                </div>
            `;
        }
        
        addOptionEventListeners(optionContainer);

        section.appendChild(optionContainer);

        // Select the option if it matches the fetched activity, but don't make a POST request
        if (selectedActivity === item.name) {
            optionContainer.classList.add('selected');
        } else if (selectedActivity && item.isCustom && !items.some(i => i.name === selectedActivity)) {
            optionContainer.classList.add('selected');
            const customInput = optionContainer.querySelector('.custom-input');
            if (customInput) {
                customInput.value = selectedActivity;
            }
        } else if (!selectedActivity && item.isNoActivity) {
            optionContainer.classList.add('selected');
        }
    });

    return section;
}

function selectOption(optionContainer) {
    const section = optionContainer.dataset.section;
    const containers = document.querySelectorAll(`.option-container[data-section="${section}"]`);
    
    containers.forEach(container => {
        container.classList.remove('selected');
    });
    
    optionContainer.classList.add('selected');

    // Get the selected choice
    let choice = optionContainer.dataset.name;

    // If it's a custom option, don't post immediately
    const customInput = optionContainer.querySelector('.custom-input');
    if (customInput) {
        customInput.focus();
    } else {
        // Only post for non-custom options when clicked
        postSelectedActivity(section.toLowerCase(), choice);
    }

    updateSummary();
}

// Function to send a POST request to the API with the selected activity
async function postSelectedActivity(slot, choice) {
    const payload = { slot, choice };
    console.log('Sending POST request with payload:', JSON.stringify(payload));

    try {
        const response = await fetch('https://rota.crowbank.uk/api/fiona61', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
        }

        console.log(`Successfully posted choice for ${slot}: ${choice}`);
    } catch (error) {
        console.error(`Failed to post choice for ${slot}: ${error.message}`);
    }
}

// Function to load all sections dynamically by looping over top-level keys in attractions
async function loadContent() {
    const content = document.getElementById('content');

    // Loop through each key (section) in the attractions object
    for (const sectionTitle of Object.keys(attractions)) {
        const formattedTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1).replace(/([A-Z])/g, ' $1');

        // Generate the section using the items in the current section
        const section = await generateSection(formattedTitle, attractions[sectionTitle]);
        content.appendChild(section);
    }

    updateSummary();
}

// Load content when page loads
window.onload = loadContent;

// Modify the event listener for option containers to handle custom input changes
function addOptionEventListeners(optionContainer) {
    optionContainer.addEventListener('click', function(e) {
        if (!e.target.closest('a') && !e.target.closest('textarea') && !e.target.closest('button')) {
            selectOption(this);
        }
    });

    const saveButton = optionContainer.querySelector('.save-button');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const section = optionContainer.dataset.section;
            const customInput = optionContainer.querySelector('.custom-input');
            const choice = customInput.value.trim();
            if (choice) {
                postSelectedActivity(section.toLowerCase(), choice);
                selectOption(optionContainer);
            }
        });
    }
}

function updateSummary() {
    let summaryHtml = '<h2>Your Day Plan Summary</h2>';
    
    ['Morning', 'Lunch', 'Afternoon', 'Tea'].forEach(section => {
        const selectedOption = document.querySelector(`.option-container[data-section="${section}"].selected`);
        let choiceText = 'No selection';
        
        if (selectedOption) {
            if (selectedOption.classList.contains('small-option')) {
                const customInput = selectedOption.querySelector('.custom-input');
                choiceText = customInput && customInput.value.trim() 
                    ? customInput.value.trim() 
                    : selectedOption.querySelector('h3').textContent.trim();
            } else {
                choiceText = selectedOption.querySelector('h3').textContent.trim();
            }
        }
        
        summaryHtml += `<p><strong>${section}:</strong> ${choiceText}</p>`;
    });

    let summarySection = document.getElementById('summary');
    if (!summarySection) {
        summarySection = document.createElement('section');
        summarySection.id = 'summary';
        document.querySelector('.container').appendChild(summarySection);
    }
    summarySection.innerHTML = summaryHtml;
}
