function generateMapLink(address) {
const baseUrl = "https://www.google.com/maps/search/?api=1&query=";
// Encode the address to be URL safe
return baseUrl + encodeURIComponent(address);
}

// Function to generate HTML for each section
function generateSection(sectionTitle, items) {
    const section = document.createElement('div');
    section.classList.add('section');
    section.innerHTML = `<h2>${sectionTitle}</h2>`;

    items.forEach((item, index) => {
        const optionContainer = document.createElement('div');
        optionContainer.classList.add('option-container');

        const option = document.createElement('div');
        option.classList.add('option');
        
        // Add the reverse class for alternating layout
        if (index % 2 !== 0) {
            option.classList.add('reverse');
        }

        const mapLink = generateMapLink(item.address); // Use the function to generate a Google Maps link

        option.innerHTML = `
            <div class="content">
                <p>${item.description}</p>
                <p class="address"><a href="${mapLink}" target="_blank">${item.address}</a></p>
            </div>
            <a href="${item.link}" target="_blank">
                <img src="${item.imgSrc}" alt="${item.title}">
            </a>
        `;

        optionContainer.innerHTML = `<h3>${item.title}</h3>`;
        optionContainer.appendChild(option);
        section.appendChild(optionContainer);
    });

    return section;
}

// Function to load all sections dynamically
// Function to load all sections dynamically by looping over top-level keys in attractions
function loadContent() {
const content = document.getElementById('content');

// Loop through each key (section) in the attractions object
Object.keys(attractions).forEach(sectionTitle => {
    // Capitalize the first letter of the section title for display
    const formattedTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1).replace(/([A-Z])/g, ' $1');
    
    // Generate the section using the items in the current section
    const section = generateSection(formattedTitle, attractions[sectionTitle]);
    content.appendChild(section);
});
}

// Load content when page loads
window.onload = loadContent;
