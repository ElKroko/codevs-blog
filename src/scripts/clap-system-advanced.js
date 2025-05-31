// Sistema híbrido: LocalStorage + API de WordPress
class ClapSystem {
    constructor(postSlug, wpApiUrl = 'https://cms.kroko.cl/wp-json') {
        this.postSlug = postSlug;
        this.wpApiUrl = wpApiUrl;
        this.storageKey = `claps_${postSlug}`;
        this.userClapKey = `user_clapped_${postSlug}`;
        this.init();
    }

    async init() {
        // Cargar datos locales
        this.localClaps = parseInt(localStorage.getItem(this.storageKey) || '0');
        this.userHasClapped = localStorage.getItem(this.userClapKey) === 'true';
        
        // Intentar sincronizar con WordPress
        try {
            const response = await fetch(`${this.wpApiUrl}/codevs/v1/claps/${this.postSlug}`);
            if (response.ok) {
                const data = await response.json();
                this.serverClaps = data.claps;
                this.updateUI(Math.max(this.localClaps, this.serverClaps));
            } else {
                this.updateUI(this.localClaps);
            }
        } catch (error) {
            console.log('WordPress no disponible, usando datos locales');
            this.updateUI(this.localClaps);
        }
    }

    async addClap() {
        if (this.userHasClapped) {
            this.showMessage('¡Ya has aplaudido este artículo!');
            return;
        }

        const newLocalClaps = this.localClaps + 1;
        
        // Guardar localmente primero
        localStorage.setItem(this.storageKey, newLocalClaps.toString());
        localStorage.setItem(this.userClapKey, 'true');
        this.localClaps = newLocalClaps;
        this.userHasClapped = true;
        
        // Actualizar UI inmediatamente
        this.updateUI(newLocalClaps);
        this.showSuccessAnimation();
        
        // Intentar enviar a WordPress en background
        try {
            const response = await fetch(`${this.wpApiUrl}/codevs/v1/claps/${this.postSlug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'add_clap' })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Clap sincronizado con WordPress:', data.claps);
            }
        } catch (error) {
            console.log('⚠️ No se pudo sincronizar con WordPress, pero se guardó localmente');
        }
    }

    updateUI(count) {
        const clapCount = document.getElementById('clap-count');
        const clapText = document.getElementById('clap-text');
        const clapButton = document.getElementById('clap-button');
        
        if (clapCount) clapCount.textContent = count.toString();
        
        if (this.userHasClapped) {
            if (clapButton) clapButton.classList.add('opacity-75');
            if (clapText) clapText.textContent = '¡Ya aplaudiste!';
        }
    }

    showSuccessAnimation() {
        const button = document.getElementById('clap-button');
        const thankYou = document.getElementById('thank-you-message');
        
        if (button) {
            button.classList.add('animate-pulse');
            setTimeout(() => button.classList.remove('animate-pulse'), 600);
        }
        
        if (thankYou) {
            thankYou.classList.remove('hidden');
            setTimeout(() => thankYou.classList.add('hidden'), 3000);
        }
    }

    showMessage(message) {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
        tempDiv.textContent = message;
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
            tempDiv.classList.add('opacity-0', 'transform', 'translate-x-full');
            setTimeout(() => tempDiv.remove(), 300);
        }, 2000);
    }
}

// Uso del sistema
document.addEventListener('DOMContentLoaded', () => {
    const postSlug = window.location.pathname.split('/').pop();
    const clapSystem = new ClapSystem(postSlug);
    
    const clapButton = document.getElementById('clap-button');
    if (clapButton) {
        clapButton.addEventListener('click', () => clapSystem.addClap());
    }
});
