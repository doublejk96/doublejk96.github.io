console.log("Hello World!")

const elements = document.querySelectorAll('div');
elements.forEach(element => 
    {
        const fruitName = element.dataset.fruitName;
        console.log(fruitName);
    })