console.log("Overwatch JS");

document.addEventListener('DOMContentLoaded', function () 
{
  const container = document.querySelector('.container .heros');
  for (let i = 1; i <= 32; ++i) 
  {
    const hero = document.createElement('div');
    hero.classList.add('hero');

    const image = document.createElement('div');
    image.classList.add('image');

    image.style.backgroundImage = `url("./image/hero${i}.png")`;

    hero.appendChild(image);
    container.appendChild(hero);
  }
});
