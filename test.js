fetch("https://api.lucian.solutions/api.foodmenu.php").then(
    data => {
        data.text().then(
            answer => {
                console.log(answer);
            }
        )
    }
);

