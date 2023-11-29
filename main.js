function showContent(contentId) 
{
    document.querySelectorAll('.content').forEach(function(content) 
    {
        content.classList.remove('active');
    });

    document.getElementById(contentId).classList.add('active');
}

window.onload = function() 
{
    const contents = document.querySelector('.contents');
    contents.style.maxHeight = window.innerHeight - 150 + 'px';
};
  