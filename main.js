function showContent(contentId) 
{
    document.querySelectorAll('.content').forEach(function(content) 
    {
        content.classList.remove('active');
    });

    document.getElementById(contentId).classList.add('active');
}
