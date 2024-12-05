// preferences.js

document.addEventListener('DOMContentLoaded', () => {
    const categoryContainer = document.querySelector('.categories-container');
    const categoryButtons = () => document.querySelectorAll('.categories-container .category-button');
    const motivationText = document.querySelector('.motivation-text p');

    // Définir les deux ensembles de catégories
    const initialCategories = [
        "Science",
        "Sécurité",
        "Environnement",
        "Technologie",
        "Santé",
        "Politique",
        "Société",
        "Culture",
        "Économie",
        "Sport"
    ];

    const newCategories = [
        "Rap",
        "Pop",
        "RnB",
        "K-Pop",
        "Rock",
        "Jazz",
        "Variété Française"
    ];

    // État initial : étape 1
    let currentStep = 1;

    // Fonction pour générer les boutons de catégories
    const generateCategoryButtons = (categories) => {
        categoryContainer.innerHTML = ''; // Vider les catégories actuelles
        categories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('category-button');
            button.textContent = category;
            // Ajouter l'événement de sélection
            button.addEventListener('click', () => {
                button.classList.toggle('selected');
            });
            categoryContainer.appendChild(button);
        });
    };

    // Générer les catégories initiales
    generateCategoryButtons(initialCategories);

    // Gestion du bouton de validation (check-button)
    const checkButton = document.querySelector('.action-button.check-button');
    if (checkButton) {
        checkButton.addEventListener('click', () => {
            if (currentStep === 1) {
                // Changer le texte de motivation
                motivationText.textContent = "Qu’est-ce qui te fait vibrer ? 🎧";

                // Remplacer les catégories
                generateCategoryButtons(newCategories);

                // Optionnel : Changer l'icône du bouton pour indiquer l'étape suivante
                checkButton.innerHTML = '<i class="fa fa-arrow-right"></i>';

                // Passer à l'étape suivante
                currentStep = 2;
            } else if (currentStep === 2) {
                const selectedCategories = Array.from(categoryButtons())
                    .filter(btn => btn.classList.contains('selected'))
                    .map(btn => btn.textContent.trim());

                console.log('Catégories sélectionnées :', selectedCategories);

                // Stocker les catégories sélectionnées (localStorage, backend, etc.)
                // Exemple avec localStorage :
                localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));

                // Afficher l'overlay avec les messages
                showWelcomeOverlay();
            }
        });
    }

    // Fonction pour afficher l'overlay et les messages séquentiels
    const showWelcomeOverlay = () => {
        const overlay = document.getElementById('overlay');
        const text1 = document.getElementById('overlay-text1');
        const text2 = document.getElementById('overlay-text2');
        const text3 = document.getElementById('overlay-text3');

        // Afficher l'overlay avec un fade-in
        overlay.classList.add('visible');

        // Afficher le premier texte après un court délai
        setTimeout(() => {
            text1.classList.add('visible');
        }, 500); // Délai avant l'apparition du premier texte (0.5s)

        // Afficher le second texte après que le premier soit visible pendant 2s
        setTimeout(() => {
            text2.classList.add('visible');
        }, 2500); // 500ms (fade-in) + 2000ms (affiché)

        // Afficher le troisième texte après que le second soit visible pendant 2s
        setTimeout(() => {
            text3.classList.add('visible');
        }, 4500); // 500ms + 2000ms + 2000ms

        // Commencer le fade-out des textes après que le troisième soit visible pendant 2s
        setTimeout(() => {
            text1.classList.remove('visible');
            text1.classList.add('fade-out');

            text2.classList.remove('visible');
            text2.classList.add('fade-out');

            text3.classList.remove('visible');
            text3.classList.add('fade-out');
        }, 6500); // 500ms + 2000ms + 2000ms + 2000ms

        // Rediriger après que les textes aient disparu plus un petit délai
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 8000); // 500ms + 2000ms + 2000ms + 2000ms + 500ms
    };
});
