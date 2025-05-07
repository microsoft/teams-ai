// Add current year to footer
document.addEventListener('DOMContentLoaded', function() {
    const yearElement = document.querySelector('.copyright');
    if (yearElement) {
        yearElement.innerText = yearElement.innerText.replace('{current_year}', new Date().getFullYear());
    }
});