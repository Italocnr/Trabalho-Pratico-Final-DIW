// URL base da API
const API_URL = 'http://localhost:3000';

// Verificar se usuário está logado ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    const usuarioId = localStorage.getItem('usuarioId');
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    
    if (!usuarioId || !tipoUsuario) {
        alert('Você precisa estar logado para ver seus favoritos!');
        window.location.href = 'login.html';
        return;
    }
    
    carregarFavoritos();
});

// Função para carregar favoritos do usuário
async function carregarFavoritos() {
    const container = document.getElementById('favoritos-container');
    const vazio = document.getElementById('favoritos-vazio');
    const usuarioId = localStorage.getItem('usuarioId');
    
    if (!usuarioId || !container) return;
    
    try {
        // Buscar favoritos do usuário
        const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioId}`);
        if (!response.ok) throw new Error('Erro ao carregar favoritos');
        
        const favoritos = await response.json();
        
        if (!Array.isArray(favoritos) || favoritos.length === 0) {
            container.innerHTML = '';
            if (vazio) vazio.style.display = 'block';
            return;
        }
        
        // Buscar detalhes dos eventos favoritados
        const eventosIds = favoritos.map(f => f.eventoId);
        const eventos = [];
        
        for (const eventoId of eventosIds) {
            try {
                const eventoResponse = await fetch(`${API_URL}/eventos/${eventoId}`);
                if (eventoResponse.ok) {
                    const evento = await eventoResponse.json();
                    eventos.push(evento);
                }
            } catch (e) {
                console.error(`Erro ao carregar evento ${eventoId}:`, e);
            }
        }
        
        // Exibir eventos
        container.innerHTML = '';
        if (eventos.length === 0) {
            if (vazio) vazio.style.display = 'block';
            return;
        }
        
        eventos.forEach(async evento => {
            const card = await criarCardFavorito(evento);
            container.appendChild(card);
        });
        
        if (vazio) vazio.style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erro ao carregar favoritos. Verifique se o servidor está rodando.
                </div>
            </div>
        `;
    }
}

// Função para criar card de evento favorito
async function criarCardFavorito(evento) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const imagem = evento.secaoDetalhes1?.imagem || evento.imagem || 'assets/img/calendario.png';
    const titulo = evento.titulo || 'Evento';
    const introducao = evento.introducao || '';
    const eventoId = evento.id || '';
    
    // Verificar se é favorito (deve ser sempre true nesta página)
    const jaFavorito = await isFavorito(eventoId);
    
    // Escapar HTML
    const escapeHtml = (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    col.innerHTML = `
        <div class="card h-100 shadow-sm" style="position: relative;">
            <button class="btn btn-link p-0 favorito-btn" 
                    data-favorito-id="${eventoId}"
                    onclick="toggleFavorito('${eventoId}', this); setTimeout(carregarFavoritos, 500);"
                    title="Remover dos favoritos"
                    style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(255,255,255,0.9); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <i class="fas fa-heart text-danger fa-2x"></i>
            </button>
            <img src="${escapeHtml(imagem)}" 
                 class="card-img-top" 
                 alt="${escapeHtml(titulo)}" 
                 style="height: 200px; object-fit: cover;"
                 onerror="this.src='assets/img/calendario.png'">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title text-primary">${escapeHtml(titulo)}</h5>
                <p class="card-text flex-grow-1">${escapeHtml(introducao.substring(0, 120))}${introducao.length > 120 ? '...' : ''}</p>
                <a href="detalhes-evento.html?id=${escapeHtml(eventoId)}" 
                   class="btn btn-primary mt-auto align-self-center">
                    <i class="fas fa-info-circle me-2"></i>Ver Detalhes
                </a>
            </div>
        </div>
    `;
    
    return col;
}


