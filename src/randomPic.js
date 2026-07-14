const drinks = [
    "Trà sữa trân châu",
    "Matcha Latte",
    "Ô long latte",
    "Trà đào cam sả",
    "Trà vải",
    "Trà chanh",
    "Hồng trà",
    "Sữa tươi trân châu đường đen",
    "Kem Cheese",
    "Trà xanh",
    "Americano",
    "Cappuccino",
    "Latte",
    "Espresso",
    "Mocha",
    "Bạc xỉu",
    "Cà phê sữa",
    "Cà phê đen",
    "Chocolate",
    "Yakult đào"
];

const streets = [
    "Nguyễn Huệ",
    "Nguyễn Tất Thành",
    "An Dương Vương",
    "Trần Hưng Đạo",
    "Lê Lợi",
    "Hai Bà Trưng",
    "Tây Sơn",
    "Chương Dương",
    "Phan Bội Châu",
    "Phan Đình Phùng",
    "Ngô Mây",
    "Lê Hồng Phong",
    "Xuân Diệu",
    "Trần Phú",
    "Đống Đa"
];

const places = [
    "Eo Gió",
    "Kỳ Co",
    "Ghềnh Ráng",
    "Bãi biển Quy Nhơn",
    "Bãi tắm Hoàng Hậu",
    "Quảng trường Nguyễn Tất Thành",
    "Ga Quy Nhơn",
    "Tháp Đôi",
    "Đại học Quy Nhơn",
    "Co.opmart Quy Nhơn",
    "GO! Quy Nhơn",
    "Bệnh viện Đa khoa tỉnh Bình Định"
];

const unrelated = [
`TODO
Fix login
Deploy server`,

`Shopping List
Milk
Bread
Eggs`,

`Meeting
09:30
Room B203`,

`Happy Birthday 🎂`,

`Weather
31°C
Sunny`,

`Lorem ipsum
dolor sit amet`,

`Weekly Report
Complete
Done`
];

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p) {
    return Math.random() < p;
}

function randomPhone() {
    const number =
        "0" +
        (Math.floor(Math.random() * 8) + 3) +
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");

    switch (Math.floor(Math.random() * 5)) {
        case 0:
            return number;

        case 1:
            return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;

        case 2:
            return `${number.slice(0, 4)}.${number.slice(4, 7)}.${number.slice(7)}`;

        case 3:
            return `${number.slice(0, 4)}-${number.slice(4, 7)}-${number.slice(7)}`;

        default:
            return `(+84) ${number.substring(1,4)} ${number.substring(4,7)} ${number.substring(7)}`;
    }
}

function randomAddress() {

    if (chance(0.35))
        return random(places);

    const no = Math.floor(Math.random() * 300) + 1;
    const street = random(streets);

    const styles = [
        `${no} ${street}`,
        `${no} Đ. ${street}`,
        `${no} Đ ${street}`,
        `${no}, ${street}`
    ];

    return random(styles);
}

function buildDrinkSample() {

    const fields = [
        random(drinks),
        randomAddress(),
        randomPhone()
    ];

    // đảo vị trí
    fields.sort(() => Math.random() - 0.5);

    let lines = [];

    if (chance(0.3))
        lines.push(random([
            "Đơn nước",
            "Order",
            "Hóa đơn",
            "Thông tin",
            "-----"
        ]));

    fields.forEach(f => {

        lines.push(f);

        if (chance(0.25))
            lines.push("");
    });

    return lines.join("\n");
}

export const genRandomPicUrl = () => {
    let urls = "";
    const text = chance(0.25)
        ? random(unrelated)
        : buildDrinkSample();
    
    
    urls = `https://placehold.co/400x300.png?text=${encodeURIComponent(text)}`
    
    return urls
}
