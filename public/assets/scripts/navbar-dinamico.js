// Função para atualizar navbar baseado no usuário logado
function atualizarNavbar() {
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioData = localStorage.getItem('usuarioData');
    
    const navCadastro = document.getElementById('nav-cadastro');
    
    // Verificar se é admin
    let isAdmin = false;
    if (tipoUsuario === 'admin') {
        isAdmin = true;
    } else if (usuarioData) {
        try {
            const user = JSON.parse(usuarioData);
            isAdmin = user.admin === true || user.admin === 'true';
        } catch (e) {
            console.error('Erro ao parsear dados do usuário:', e);
        }
    }
    
    // Mostrar/ocultar links
    if (navCadastro) {
        navCadastro.style.display = isAdmin ? 'block' : 'none';
    }
}

// Atualizar navbar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    atualizarNavbar();
    
    // Atualizar também após um pequeno delay para garantir que todos os scripts carregaram
    setTimeout(atualizarNavbar, 500);
});

// Atualizar quando o usuário fizer login/logout (storage event funciona entre abas)
window.addEventListener('storage', function(e) {
    if (e.key === 'tipoUsuario' || e.key === 'usuarioId' || e.key === 'usuarioData') {
        atualizarNavbar();
    }
});

// Disparar evento customizado quando dados mudarem na mesma aba
window.addEventListener('focus', atualizarNavbar);

// Função para fazer logout (se não existir em auth.js)
if (typeof fazerLogout === 'undefined') {
    window.fazerLogout = function() {
        if (confirm('Deseja realmente sair?')) {
            localStorage.removeItem('sessaoAluno');
            localStorage.removeItem('sessaoProfessor');
            localStorage.removeItem('sessaoAdmin');
            localStorage.removeItem('tipoUsuario');
            localStorage.removeItem('usuarioId');
            localStorage.removeItem('usuarioData');
            window.location.href = 'index.html';
        }
    };
}

