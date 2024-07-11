/*async () => {
    const response = await fetch("https://api.lucian.solutions/api.drinksmenu.php");
    const text = await response.text();
    console.log(text);
}*/

fetch("https://api.lucian.solutions/api.drinksmenu.php").then((response) => {
    response.text().then((data) => {
        console.log(data);
    });
});