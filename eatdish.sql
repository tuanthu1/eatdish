-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th2 11, 2026 lúc 05:30 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `eatdish_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `community_comments`
--

CREATE TABLE `community_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `community_likes`
--

CREATE TABLE `community_likes` (
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `community_posts`
--

CREATE TABLE `community_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `community_posts`
--

INSERT INTO `community_posts` (`id`, `user_id`, `content`, `image_url`, `likes_count`, `created_at`) VALUES
(7, 1, 'hii', NULL, 0, '2026-01-05 00:22:14'),
(8, 1, 'em muốn tìm gà ủ muối\r\n', NULL, 1, '2026-01-08 15:23:20'),
(10, 7, 'fsaead', NULL, 0, '2026-01-29 09:48:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `user_id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `favorites`
--

INSERT INTO `favorites` (`user_id`, `recipe_id`, `created_at`) VALUES
(1, 26, '2026-01-16 13:13:22'),
(6, 26, '2026-01-27 10:56:43'),
(14, 26, '2026-01-21 15:38:26'),
(34, 30, '2026-02-03 20:23:31'),
(34, 58, '2026-02-03 20:23:33'),
(34, 59, '2026-02-03 20:23:25');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 1, 'Hoàng Thư đã thích món ăn \"Vịt cháy tỏi\" của bạn. ❤️', 'like_recipe', 1, '2026-01-04 17:58:36'),
(2, 1, 'tet đã theo dõi bạn', 'follow', 1, '2026-01-04 21:02:45'),
(3, 1, 'hoangtuanthu đã theo dõi bạn', 'follow', 1, '2026-01-04 21:04:19'),
(4, 1, 'Hoàng Tuấn Thư đã theo dõi bạn', 'follow', 1, '2026-01-08 21:01:19'),
(5, 1, 'Hoàng Tuấn Thư đã theo dõi bạn', 'follow', 1, '2026-01-08 21:01:51'),
(6, 1, 'Hoàng Tuấn Thư đã thích món ăn \"Vịt cháy tỏi\" của bạn. ❤️', 'like_recipe', 1, '2026-01-09 16:29:09'),
(7, 1, 'Hoàng Tuấn Thư đã thích món ăn \"Tôm càng xanh luộc nước dừa\" của bạn. ❤️', 'like_recipe', 1, '2026-01-09 16:29:14'),
(8, 1, 'Hoàng Tuấn Thư đã thích món ăn \"Sườn non nấu lagu\" của bạn. ❤️', 'like_recipe', 1, '2026-01-09 16:29:15'),
(9, 1, 'Hoàng Tuấn Thư đã thích món ăn \"Vịt cháy tỏi\" của bạn. ❤️', 'like_recipe', 1, '2026-01-09 18:17:57'),
(10, 1, 'nvhh đã thích món ăn \"Vịt cháy tỏi\" của bạn. ❤️', 'like_recipe', 1, '2026-01-09 19:19:28'),
(11, 1, 'Hoàng Tuấn Thư đã thích bài viết của bạn. ❤️', 'like', 1, '2026-01-14 04:30:59'),
(12, 1, 'Hoàng Tuấn Thư đã theo dõi bạn', 'follow', 1, '2026-01-14 06:24:53'),
(13, 1, 'Hoàng Tuấn Thư đã theo dõi bạn', 'follow', 1, '2026-01-14 07:06:49'),
(14, 1, 'hoangtuanthu đã thích món ăn \"Sủi cảo tôm thịt\" của bạn. ❤️', 'like_recipe', 1, '2026-01-21 07:47:27'),
(15, 1, 'hoangtuanthu đã theo dõi bạn', 'follow', 1, '2026-01-21 10:16:28'),
(16, 1, 'hoàng anh đã theo dõi bạn', 'follow', 1, '2026-01-21 15:38:25'),
(17, 1, 'hoàng anh đã thích món ăn \"Sủi cảo tôm thịt\" của bạn. ❤️', 'like_recipe', 1, '2026-01-21 15:38:26'),
(18, 1, 'Chúc mừng! Món \"Thịt xay rang hành lá\" của bạn đã được duyệt và hiển thị trên trang chủ.', 'info', 1, '2026-01-21 16:39:53'),
(19, 8, 'htthu đã theo dõi bạn', 'follow', 0, '2026-01-23 09:22:36'),
(20, 1, 'quyet đã thích món ăn \"Sủi cảo tôm thịt\" của bạn. ❤️', 'like_recipe', 1, '2026-01-25 12:33:12'),
(21, 1, 'quyet đã thích món ăn \"Sủi cảo tôm thịt\" của bạn. ❤️', 'like_recipe', 1, '2026-01-27 10:56:43'),
(22, 1, 'quyet đã theo dõi bạn', 'follow', 1, '2026-01-27 12:08:10'),
(23, 1, 'Chúc mừng! Món \"Heo quay giòn bì kiểu 3: không xăm bì hoặc ngâm giấm\" của bạn đã được duyệt và hiển thị trên trang chủ.', 'info', 1, '2026-01-29 20:07:21'),
(24, 34, 'Chúc mừng! Món \"Sườn non kho trứng cút\" của bạn đã được duyệt và hiển thị trên trang chủ.', 'info', 1, '2026-01-29 20:20:18'),
(25, 34, 'Chúc mừng! Món \"Sườn Xào Chua Ngọt\" của bạn đã được duyệt và hiển thị trên trang chủ.', 'info', 1, '2026-01-29 20:45:57'),
(26, 7, 'Thư Hoàng Tuấn đã thích bài viết của bạn. ❤️', 'like', 1, '2026-01-29 22:38:24'),
(27, 34, 'Admin EatDish đã thích món ăn \"Sườn Xào Chua Ngọt\" của bạn. ❤️', 'like_recipe', 1, '2026-01-31 11:19:42'),
(28, 1, 'Thư Hoàng Tuấn đã thích món ăn \"Thịt xay rang hành lá\" của bạn. ❤️', 'like_recipe', 1, '2026-02-03 20:23:31');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `recipes`
--

CREATE TABLE `recipes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `time` varchar(50) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `ingredients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ingredients`)),
  `steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`steps`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `video_url` text DEFAULT NULL,
  `status` enum('pending','active','rejected') DEFAULT 'pending',
  `author_id` int(11) NOT NULL,
  `is_premium` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `recipes`
--

INSERT INTO `recipes` (`id`, `name`, `description`, `calories`, `time`, `img`, `ingredients`, `steps`, `created_at`, `video_url`, `status`, `author_id`, `is_premium`) VALUES
(26, 'Sủi cảo tôm thịt', '#viTetbonphuong Sủi cảo là món ăn truyền thống dịp năm mới của người Trung Quốc, tượng trưng cho sự đoàn tụ, thịnh vượng và tài lộc', 320, '15 phút', 'https://img-global.cpcdn.com/recipes/5591a93982ee0483/1200x630cq80/photo.jpg', '[\r\n    \"500 g thịt xay\",\r\n    \"300 g tôm lớn\",\r\n    \"1/2 trái bắp Mỹ luộc\",\r\n    \"1 xấp vỏ sủi cảo\",\r\n    \"30 g hành lá\",\r\n    \"1 mc nước mắm\",\r\n    \"1 mcf hạt nêm\",\r\n    \"1/2 mcf tiêu xay\"\r\n  ]', '[\r\n    \"Các nguyên liệu chuẩn bị sẵn sàng: tôm bóc vỏ, bỏ đầu và chỉ lưng, cắt nhỏ, bắp tách hạt, trộn đều tất cả nguyên liệu và gia vị\",\r\n    \"Ấn khuôn để tạo hình bánh\",\r\n    \"Chiên vàng các mặt, chấm cùng tương ớt và sốt mayonaise\"\r\n  ]', '2026-01-16 12:50:08', 'https://www.youtube.com/watch?v=hmhNh-DEgFs', 'active', 1, 1),
(27, 'Thịt xay rang hành lá', '#Cookpadapron2025 #mónăntrưa', 200, '15 phút', 'https://img-global.cpcdn.com/recipes/75021c27ade48cd7/1200x630cq80/photo.jpg', '[\"300 g thịt xay\",\"50 g hành lá\",\"Gia vị\"]', '[\"Phi thơm đầu hành, cho thịt xay vào đảo đều, thêm nước, nước mắm, nước tương và ít đường\",\"Nước cạn bớt thì cho hành lá vào\",\"Rắc thêm ít tiêu xay cho thơm\"]', '2026-01-21 16:39:18', NULL, 'active', 1, 0),
(28, 'Canh gà nấu rau nấm', '#Cookpadapron2025 #mónăntrưa', 320, '15 phút', 'https://img-global.cpcdn.com/recipes/5353c6bbd1b5295e/1200x630cq80/photo.jpg', '[\"1 đùi gà\",\"50 g nấm linh chi nâu\",\"100 g rau giá\",\"Hành lá\",\"Gia vị\"]', '[\"Phi thơm đầu hành, cho gà vào đảo săn rồi cho nước vào hầm\",\"Gà mềm cho rau và nấm vào\",\"Thêm nước mắm và hành lá\"]', '2026-01-21 16:39:18', NULL, 'active', 1, 0),
(30, 'Thịt xay rang hành lá', '#Cookpadapron2025 #mónăntrưa', 200, '30 mins', 'https://img-global.cpcdn.com/recipes/75021c27ade48cd7/1200x630cq80/photo.jpg', '[\"300 g thịt xay\",\"50 g hành lá\",\" Gia vị\"]', '[\"Phi thơm đầu hành, cho thịt xay vào đảo đều, thêm nước, nước mắm, nước tương và ít đường\",\"Nước cạn bớt thì cho hành lá vào\",\"Rắc thêm ít tiêu xay cho thơm\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 1),
(32, 'Heo quay giòn bì kiểu 3: không xăm bì hoặc ngâm giấm', '#Cookpadapron2025 #mónăntrưa Thấy có bạn chia sẻ cách làm không cần muối giấm hay xăm da heo nên mình cũng làm thử, kết quả phần bì vẫn nổ giòn ngon mà lại đơn giản nữa', 250, '23 phút', 'https://img-global.cpcdn.com/recipes/7dd06a6af15ca73c/1200x630cq80/photo.jpg', '[\"400 g thịt đùi\",\"1/2 mcf hạt nêm\",\"1 mc muối tôm\"]', '[\"Thịt bóp muối giấm rửa sạch, ướp đơn giản với muối tôm và hạt nêm trong 30 phút hoặc để qua đêm trong tủ lạnh. Sau đó cho thịt vào nồi chiên không dầu, đặt mặt da lên sấy 80° 30 phút, quay thịt lên bật tiếp 160° 20 phút cho thịt chín\",\"Quay phần da lên, tăng nhiệt 200° 20 phút cho da nổ đều là xong\",\"Cắt miếng vừa ăn, chấm kèm nước mắm chua ngọt rất ngon, phần da nổ giòn rụm hấp dẫn\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(33, 'Heo quay giòn bì kiểu 2: ngâm bì trong giấm', '#Cookpadapron2025 #mónăntrưa Lần này là cách 2 với kiểu ngâm bì trong giấm, không xăm bì và cũng không cần luộc', 600, '30 phút', 'https://img-global.cpcdn.com/recipes/85bc150b4b2a4056/1200x630cq80/photo.jpg', '[\"1 kg thịt ba rọi\",\" Nước ngâm da heo: 1/3 chai giấm gạo, 1/2 mcf muối\",\" Gia vị ướp thịt: 1/2mcf ngũ vị hương, 1mcf hạt nêm\"]', '[\"Thịt heo bóp muối giấm rửa sạch rồi ngâm ngập phần da heo trong giấm, phần thịt ướp đơn giản với hạt nêm và ngũ vị hương, ngâm 1 tiếng hoặc để vào tủ lạnh ngâm qua đêm\",\"Sau khi ngâm giấm thì lấy thịt ra, lau khô đi và bôi một lớp muối mỏng lên da, sấy da 80° 60 phút trong nồi chiên không dầu, sau đó quay mặt thịt lên nướng 160° 30 phút cho thịt chín\",\"Cuối cùng quay phần bì lên bật 200° 15 phút cho đến khi phần da nổ giòn là được\"]', '2026-01-21 16:45:27', NULL, 'pending', 1, 0),
(34, 'Lẩu gà lá é', '#Cookpadapron2025', 220, '23 phút', 'https://img-global.cpcdn.com/recipes/b112e48d117d1c98/1200x630cq80/photo.jpg', '[\"1/2 con gà\",\"100 g nấm rơm\",\"1 hộp  nấm linh chi nâu\",\"2 cây sả\",\" Hành lá\",\"150 g lá é\",\"500 g bún tươi\",\" Gia vị¹\"]', '[\"Sả cắt khúc, đập dập. Gà chặt miếng, ướp với hạt nêm, tiêu xay và bột nghệ 30 phút. Phi thơm sả và đầu hành, cho gà vào đảo săn rồi cho nước vào nấu sôi\",\"Nêm nước mắm và hạt nêm vừa ăn rồi cho hành ớt vào, thêm nấm rơm vào\",\"Trụng bún, cho nấm linh chi nâu ra dĩa, thêm chén nước mắm chua ngọt để chấm gà\",\"Cuối cùng thêm lá é vào và thưởng thức thôi\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(35, 'Sữa chua xoài vú sữa', '#Cookpadapron2025', 420, '30 mins', 'https://img-global.cpcdn.com/recipes/c28e40987c2fd4fa/1200x630cq80/photo.jpg', '[\"1/2 trái xoài\",\"2 trái vú sữa\",\"2 hộp sữa chua\"]', '[\"Vú sữa rửa vỏ ngoài, chọn quả chín mềm, cắt đôi theo chiều ngang rồi dùng muỗng múc hết phần thịt\",\"Xoài cắt lát mỏng, cuộn lại tạo hình bông hoa\",\"Cuối cùng thêm 2 hộp sữa chua vào và thưởng thức lạnh sẽ ngon hơn\"]', '2026-01-21 16:45:27', NULL, 'pending', 1, 0),
(36, 'Bữa cơm đổi vị với các món Nhật', '#Cookpadapron2025', 123, '15 phút', 'https://img-global.cpcdn.com/recipes/13d5862a03bc5f7e/1200x630cq80/photo.jpg', '[\" Cơm thịt chiên xù Tonkatsu\",\" Tôm thịt lăn bột chiên\",\" Canh rong biển miso\",\" Khoai lang nướng cam mật ong\"]', '[\"Cơm thịt chiên xù Tonkatsu\",\"Tôm thịt lăn bột chiên\",\"Canh rong biển miso\",\"Khoai lang nướng cam mật ong\",\"Bữa cơm đổi vị với các món Nhật hấp dẫn\"]', '2026-01-21 16:45:27', NULL, 'pending', 1, 0),
(37, 'Bắp chiên bơ và bột ớt', '#10Nam1HanhTrinh Món này của bạn bếp @Bharti Dhiraj Dand, thay cho món bắp xào quen thuộc', 150, '14 phút', 'https://img-global.cpcdn.com/recipes/1c7af35cb0aac213/1200x630cq80/photo.jpg', '[\"1 trái bắp luộc\",\"1/2 mcf bột ớt\",\"1 mcf bơ mặn\",\"Ít muối\"]', '[\"Chuẩn bị các nguyên liệu. Bắp tách rời từng hạt\",\"Cho bơ vào chảo cho tan chảy với nhiệt thấp, sau đó cho bắp vào xào thơm, cho muối và bột ớt vào xào chung\",\"Cuối cùng múc ra chén, rắc thêm ít bột ớt cho đẹp và đậm vị hơn, loại ớt này không cay nên có thể cho các bé ăn bình thường nhé\"]', '2026-01-21 16:45:27', NULL, 'pending', 1, 0),
(38, 'Thịt xào củ hành trộn dưa leo cà chua', '#Cookpadapron2025 #dưaleo', NULL, NULL, 'https://img-global.cpcdn.com/recipes/702efb99b9361d7b/1200x630cq80/photo.jpg', '[\"400 g thịt ba rọi\",\"2 củ  hành tây\",\"1 trái dưa leo\",\"1 trái cà chua\",\" Hành lá\",\" Mè trắng\",\" Gia vị\"]', '[\"Thịt cắt nhỏ, ướp với 2mcf nước tương, 1/2mc dầu hào, ít dầu mè và mè trắng trong 30 phút. Hành tây cắt múi cau. Phi thơm đầu hành, cho thịt vào xào săn\",\"Cho thêm nước vào xào cho thịt nhanh chín. Thịt chín thì cho hành tây vào xào chung, nêm thêm ít nước tương, hành tây mềm thì cho hành lá vào\",\"Dưa leo và cà chua cắt lát, trộn cùng bò xào để giữ độ giòn hoặc có thể xào chung\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(40, 'Cơm nhà ngày cuối tuần', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/053726f0e694ec41/1200x630cq80/photo.jpg', '[\" Thịt heo rang húng quế\",\" Gà luộc\",\" Rau muống luộc\",\" Canh đầu cá diêu hồng nấu ngót\",\" Ổi hồng và thơm\"]', '[\"Thịt heo rang húng quế\",\"Gà luộc với đầu hành và muối\",\"Rau muống luộc\",\"Canh đầu cá diêu hồng nấu ngót\",\"Ổi hồng và thơm\",\"Muối tiêu lá chanh\",\"Cơm nhà ngày cuối tuần với nhiều món ăn ngon\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(41, 'Canh đầu cá diêu hồng nấu ngót', '#Cookpadapron2025 #mónăntrưa', NULL, NULL, 'https://img-global.cpcdn.com/recipes/81ab8241b699d556/1200x630cq80/photo.jpg', '[\" Đầu và đuôi cá\",\"2 trái cà chua\",\"50 g cần tây\",\"1 mcf đầu hành\",\" Gia vị\"]', '[\"Đầu và đuôi cá chiên qua. Phi thơm đầu hành rồi cho cà chua vào đảo đều, thêm nước nấu canh\",\"Cần tây rửa sạch, cắt khúc\",\"Nước sôi cho cần tây vào, nêm muối và hạt nêm cùng ít tiêu xay và tỏi phi\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(42, 'Thịt heo rang húng quế', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/68dee885878757f6/1200x630cq80/photo.jpg', '[\"300 g thịt đùi\",\"1 nắm lá húng quế\",\"1 mc tỏi băm\",\" Gia vị\"]', '[\"Thịt đùi cắt lát mỏng, bóp muối rửa sạch. Phi thơm tỏi băm rồi cho thịt vào đảo săn rồi cho nước vào\",\"Thêm nước tương, nước mắm, ít đường và tương ớt và rang cho thịt thấm vị và nước cạn bớt thì cho húng quế vào\",\"Rắc thêm ít tiêu xay và tỏi phi\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(43, 'Trái cây ngâm đường', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/f3843e50f2990863/1200x630cq80/photo.jpg', '[\" Trái cây các loại (thơm, dâu, nho...)\",\" Đường\"]', '[\"Trái cây các loại rửa sạch, cắt miếng vừa ăn\",\"Xếp lần lượt vào lọ với 1 lớp trái cây, 1 lớp đường xen kẽ\",\"Để vào tủ lạnh, có thể dùng trái cây lạnh hoặc đợi đến khi trái cây hòa với đường ra phần nước, pha nước này với đá uống giải khát\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(44, 'Cơm nhà đơn giản', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/0e6b2ada2373257e/1200x630cq80/photo.jpg', '[\" Phile cá diêu hồng chiên giòn\",\" Canh bí xanh nấu thịt xay\",\" Cocktail trái cây\"]', '[\"Phile cá diêu hồng bóp muối rửa sạch, ướp với chút hạt nêm 10 phút, thấm khô, cho chút bột bắp vào dầu ăn cho khỏi bắn dầu rồi cho cá vào chiên vàng giòn\",\"Để ra khay cho ráo dầu rồi cho ra dĩa, chấm cùng nước mắm tỏi ớt\",\"Canh bí xanh nấu thịt xay\",\"Cocktail trái cây\",\"Cơm nhà đơn giản mà ngon\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(45, 'Mì mực nấu nấm', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/087c997226bb4616/1200x630cq80/photo.jpg', '[\"4 con mực\",\"50 g nấm rơm\",\"2 vắt kì trứng\",\" Hành lá\",\" Gia vị\"]', '[\"Phi thơm đầu hành, cho nấm rơm đã cắt sạch\",\"Mực cắt khoanh cho vào nấu sôi\",\"Nước sôi cho mì vào nấu chín, thêm ít hành lá và tiêu xay\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(46, 'Đùi gà bó xôi', '#Cookpadapron2025 Món này rất ngon với phần xôi giòn rụm cùng gà nướng thơm ngon', NULL, NULL, 'https://img-global.cpcdn.com/recipes/e47721a0fff9512a/1200x630cq80/photo.jpg', '[\"1 cái đùi tỏi gà\",\"1 chén xôi trắng\",\" Gia vị\"]', '[\"Gà ướp với 1mc tương ớt, 1mcf dầu hào, 2mc nước tương, ít dầu mè 30 phút cho thấm. Xôi dàn đều ra một cái túi nilon sạch, dùng muỗng ép đều cho xôi dàn ra một lớp mỏng\",\"Gà cho vào nồi chiên không dầu nướng 160° 20 phút mỗi mặt cho gà chín, sau đó cắt túi nilon ra, đặt gà lên trên và bọc xôi lại xung quanh, vẫn dùng túi nilon để cố định phần xôi, để vào tủ mát 30 phút để định hình phần xôi, sau đó chiên giòn phần xôi này\",\"Chiên các mặt cho chín đều và để lên rây cho ráo dầu\",\"Thành phẩm lớp xôi giòn rụm, gà thì mềm mọng vừa ăn, chấm xôi và gà vào chén tương ớt và mayonaise rất hấp dẫn\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(47, 'Bữa trưa nhiều món cho cuối tuần', '#Cookpadapron2025 #bữaăntrưa', NULL, NULL, 'https://img-global.cpcdn.com/recipes/a5ea3f0244ec1b8e/1200x630cq80/photo.jpg', '[\" Cá hấp nước tương\",\" Mọc rim chua ngọt\",\" Sườn xào chua ngọt\",\" Canh bí xanh nấu mọc tép khô\",\" Xoài Thái\"]', '[\"Cá hấp nước tương\",\"Mọc rim chua ngọt\",\"Sườn xào chua ngọt\",\"Canh bí xanh nấu mọc tép khô\",\"Xoài Thái\",\"Bữa trưa nhiều món cho cuối tuần thơm ngon, hấp dẫn\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(48, 'Cá hấp nước tương', '#Cookpadapron2025 #mónăntrưa', NULL, NULL, 'https://img-global.cpcdn.com/recipes/3b5ce6b985e2267b/1200x630cq80/photo.jpg', '[\"2 con cá (loại nào cũng được)\",\"1 củ  hành tây nhỏ\",\"1 miếng gừng\",\"30 g hành lá\",\" Gia vị\"]', '[\"Cá rửa qua, ngâm nước gừng giấm 10 phút để khử mùi tanh, sau đó rửa kỹ lại và khéo xéo, ướp ít hạt nêm và tiêu xay 10 phút rồi cho vào dĩa sâu lòng hấp cùng gừng và hành tây cắt lát, hành lá cắt khúc cùng 1mcf đường, 2mc nước tương, ít hạt nêm và tiêu xay\",\"Đậy nắp hấp 15 phút cho cá chín\",\"Cuối cùng thêm ít tiêu xay và hành lá trang trí\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(49, 'Tôm sú sốt bơ tỏi', '#Cookpadapron2025', NULL, NULL, 'https://img-global.cpcdn.com/recipes/6d2a2084a79bfadc/1200x630cq80/photo.jpg', '[\"700 g tôm sú\",\"1 mc tỏi băm\",\"1 mc bơ mặn\",\"2 mc dầu ăn\",\"1/3 chén nước mắm tỏi ớt\",\"1 mcf đường\",\"1 mcf tỏi phi\",\"10 g hành lá\"]', '[\"Phi thơm tỏi băm với dầu ăn\",\"Tôm lấy phần chỉ lưng và phần dơ trên đầu, cắt bỏ râu và rửa lại, sau đó trút vô chảo đảo săn với lửa lớn, thêm bơ vào cho thơm\",\"Thêm chén nước mắm và đường vào, cuối cùng thêm hành lá và tỏi phi\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(51, 'Thịt kho trứng', '#10Nam1HanhTrinh #thang5', NULL, NULL, 'https://img-global.cpcdn.com/recipes/641da5984ebe24ab/1200x630cq80/photo.jpg', '[\"700 g thịt ba rọi\",\"7 quả trứng gà ta\",\"1 trái dừa xiêm\",\" Dầu ăn, nước mắm, đường...\"]', '[\"Thịt ba rọi rửa sạch cắt miếng vừa ăn,trứng luộc chín, lột vỏ\",\"Pha sốt ướp thịt gồm 1 muỗng canh hành tỏi băm, 1 muỗng canh nước mắm, 1/2 muỗng canh đường, 2 muỗng cà phê hạt nêm, xíu tiêu. Rồi bắc nồi với xíu dầu ăn phi thơm hành tím, cho sốt ướp vô khuấy tan rồi tắt bếp, cho thịt vô ướp 15 phút.\",\"Bắc nồi thịt lên bếp kho cho sốt ướp keo lại thì đổ nước dừa lên, cho trứng lên kho lửa nhỏ đến khi thịt mềm, nêm nếm cho vừa ăn.\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(52, 'Sườn xào chua ngọt bằng gói sốt', '#Cookpadapron2025 #sườnsụn', NULL, NULL, 'https://img-global.cpcdn.com/recipes/6bd9a53e645f30e8/1200x630cq80/photo.jpg', '[\"500 g sườn sụn\",\"1 gói sốt sườn xào chua ngọt\",\" Hành ngò\",\" Gia vị\"]', '[\"Sườn bóp muối rửa sạch, ướp với gói sốt để tủ lạnh qua đêm cho thấm. Phi thơm đầu hành, cho sườn vào xào săn\",\"Cho phần sốt ướp còn lại và thêm 1/2 chén nước vào rim để sườn mềm. Sau 20 phút là sườn mềm, nêm lại cho vừa vị rồi thêm hành lá cắt khúc vào đảo đều\",\"Gắp sườn ra dĩa, thêm ít tiêu xay và tỏi phi\"]', '2026-01-21 16:45:27', NULL, 'active', 1, 0),
(58, 'Sườn non kho trứng cút', 'Ăn hao cơm lắm à nha😆', 1200, '60p', 'http://localhost:5000/uploads/1769717999187.webp', '[\"500 g sườn non\",\"30 quả trứng cút\",\"2 cây sả\",\"2-3 tép tỏi\",\"1 củ hành khô\",\"1 tsp hạt tiêu\",\"1 tbsp hạt nêm\",\"2 tbsp dầu hào\"]', '[\"Sả rửa sạch băm nhỏ, hành tỏi băm nhỏ.\\nSườn non rửa sạch cắt khúc vừa ăn, ướp sườn với dầu hào và hạt nêm cùng sả, tỏi băm.\\n\\nTrúng cút luộc chín, bóc vỏ.\",\"Cho 1 ít dầu ăn vào nồi, dầu nóng cho sườn vào đảo đều lửa lớn cho ngấm gia vị.\\n\\nCho nước lọc vào xâm xấp mặt sườn, nước sôi thì giảm lửa nhỏ nhất đậy nắp kho trong 30 phút.\\nNinh sườn nên dùng nồi gang dày, sườn sẽ mềm và thịt vẫn còn hồng bên trong, không bị mất nước. Hoặc không có thì dùng nồi áp suất cũng được.\",\"Cho trứng cút vào nấu thêm 20 phút nữa.\\nNêm lại gia vị cho vừa ăn.\",\"Tắt bếp, múc ra đĩa, rắc tiêu và thưởng thức.\"]', '2026-01-29 20:19:59', NULL, 'active', 34, 1),
(59, 'Sườn Xào Chua Ngọt', 'Đây là món mà mình thích ăn nhất mỗi khi đi chơi hoặc ăn bên ngoài. Lúc nào cũng kêu món này. Hôm nay mình làm để ăn cho đã bụng ^^', 400, '30', 'http://localhost:5000/uploads/1769719548283.webp', '[\"720g sườn lợn\",\"10gr Hành tím\",\"5gr Tỏi\",\"1/2mcf Bột Nêm\",\"1mcf Nước tương / Nước mắm\",\"Bột Ngũ Vị Hương\",\"3 quả Ớt\",\"5ml Dầu ăn\",\"2mcf Tinh Bột Bắp / Bột Gạo\",\"2mc Nước mắm\",\"2mc Đường\",\"1mcf Bột nêm\",\"1/4mcf Bột ngọt (tùy ý)\",\"1,5mc Tương cà chua Ketchup\",\"1mc Tương Ớt\",\"1mc Dầu Hàu\",\"1mc Chanh / Giấm\"]', '[\"Sườn rửa sạch, luộc sơ với muối và vài lát gừng rồi rửa sạch lần nữa. Cho sườn vào nồi, đổ sâm sấp nước, cho 1 củ hành khô nướng, 2 thìa cf muối, 1 thìa cf đường vào ninh sườn trong 15 phút cho sườn chín mềm. Sau đó vớt sườn ra (nước để nấu canh). Cho 2 thìa canh bột ngô áo đều vào sườn rồi chiên vàng.\",\"Cà chua bỏ vỏ, ruột, cắt hạt lựu. Phi thơm hành, cho cà chua vào với 1 thìa canh mắm, rim cho cà chua mềm. Cho tương cà, đường, xíu nước vào. Nếm sốt cho vừa khẩu vị gia đình bạn rồi cho sườn vào đảo đều.\",\"Để om trên bếp 5-7 phút cho sườn ngấm sốt, sốt sệt lại là được.\"]', '2026-01-29 20:45:48', 'https://www.youtube.com/watch?v=z7xfrORN2qY', 'active', 34, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT 'https://ui-avatars.com/api/?name=User',
  `cover_img` varchar(255) DEFAULT '',
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` enum('user','admin') DEFAULT 'user',
  `refresh_token` text DEFAULT NULL,
  `is_premium` tinyint(4) DEFAULT 0,
  `chatbot_count` int(11) DEFAULT 0,
  `chatbot_last_date` date DEFAULT NULL,
  `premium_since` datetime DEFAULT NULL,
  `is_verified` tinyint(4) DEFAULT 0,
  `email_verify_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `fullname`, `avatar`, `cover_img`, `bio`, `created_at`, `role`, `refresh_token`, `is_premium`, `chatbot_count`, `chatbot_last_date`, `premium_since`, `is_verified`, `email_verify_token`, `reset_token`, `reset_expires`) VALUES
(1, 'admin', NULL, '$2y$10$2veo/y6zyOmpVc8.uOwjZuGpAIjy9BThRAq0Dv3vy8sZI0lgWbA86', 'Admin EatDish', 'http://localhost:5000/uploads/5422a0f12315b0e6a5a242d3b9ef3a4d', 'http://localhost:5000/uploads/fa0c8cbd2eb352fc7baf8ffd0f5a582e', '', '2025-12-31 22:45:53', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzcwMTUyODcwLCJleHAiOjE3NzA3NTc2NzB9.mrf5Eje2icQQNZIg497HTsZd9GqxmX6AiOCkiVPiDY0', 1, 1, NULL, NULL, 1, NULL, NULL, NULL),
(5, 'user2', 'hoangthuw02@gmail.com', '$2b$10$k1DOeaTP9DZ4PJClFOdoc.PdORjlu6ukuzIww/1uI7uuCn/E98yAG', 'hoangtuanthu', 'https://ui-avatars.com/api/?name=User', '', NULL, '2026-01-04 21:04:05', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzY5ODgzODY3LCJleHAiOjE3NzA0ODg2Njd9.8AbiD27tmwJTagdWOPMzF1tOBhy_4IkxDfmbAT71YHk', 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(6, 'vanquyet', 'q@gmail.com', '123456', 'quyet', 'https://ui-avatars.com/api/?name=User', '', NULL, '2026-01-09 19:02:07', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzY5NTExMzkzLCJleHAiOjE3NzAxMTYxOTN9.Ew7sri-7jMPmFxrZbCAc3oLH6R7R4Cjr-M1OKbz0Jrw', 1, 0, NULL, '2026-01-23 21:42:24', 1, NULL, NULL, NULL),
(7, 'hhh', 'h@gmail.com', '$2b$10$zTg.aWtla1cA1ArJyoTpaOYK8KfzhxZppESm8eNx5WJWbwVI/8sFu', 'nvhh', 'https://ui-avatars.com/api/?name=nvhh&background=random&color=fff&size=128', '', '', '2026-01-09 19:18:52', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzcwMjMyODk4LCJleHAiOjE3NzA4Mzc2OTh9.fsO1vmPf55zDPUymmItvvD4XFZJYXH2eEgqjvpEZHT0', 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(8, 'log1', 'admin@yolohub.com', '$2b$10$ZScpTbZcfrzhxLd/Mm.Kbe3nf5C7Qh5uHz0M1D.8e31xe9N1tzMQS', 'hongha', 'https://ui-avatars.com/api/?name=hongha&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:10:55', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(10, 'abcde', 'rg@gmail.com', '$2b$10$cn6wiLOBWzu1x0KrBF5rqu5yM1xqIey7Ov67bbCdzQx0DaX2/iJuW', 'honganh', 'https://ui-avatars.com/api/?name=honganh&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:14:46', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(11, 'haa123', 'bob.smith@student.com', '$2b$10$m4xqKD.j9PtJTR3ihw.byugfb/dEerZnudhpQaxkZNj7vp0a0m7XK', 'honghaa', 'https://ui-avatars.com/api/?name=honghaa&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:22:58', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(12, 'tuanttu', 'bo@gmail.com', '$2b$10$P6bRTMfCGV4rD7WLtImY9OBg9MoNxQEtuemO.SWg5TUjer000aaMq', 'h Thu', 'https://ui-avatars.com/api/?name=h%20Thu&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:27:48', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(13, 'tsfdfs', 'a@yolohub.com', '$2b$10$O9wjuLqRzqEwzybUBbFqsO/nQI/HYsy0uiTBBjdrzbSK/OVGjtAJq', 'hoàng anh', 'https://ui-avatars.com/api/?name=ho%C3%A0ng%20anh&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:28:22', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(14, 'htt123', 'bob@student.com', '$2b$10$fX.JHdZdPTzQ8uOveopFzeZaBkV8RhHK75QhK9GOwf892tG1GXnT.', 'hoàng anh', 'https://ui-avatars.com/api/?name=ho%C3%A0ng%20anh&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:28:58', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImlhdCI6MTc2OTAwNTc3OCwiZXhwIjoxNzY5NjEwNTc4fQ.psG4eG__sfr2nQU5JuKKeIApVvNeaJ6t5jhIOYLAllw', 0, 0, NULL, '2026-01-23 04:59:22', 1, NULL, NULL, NULL),
(15, 'user11', 'smith@student.com', '$2b$10$u3/08NhiNm6o526r4mf4z.dwoB7Hrj6cL4lRGHQuvQLbDk.AIqntC', 'hoàng ll', 'https://ui-avatars.com/api/?name=ho%C3%A0ng%20ll&background=random&color=fff&size=128', '', NULL, '2026-01-21 14:29:22', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImlhdCI6MTc2OTY4OTMxMSwiZXhwIjoxNzcwMjk0MTExfQ.PuFCVjjfwrLWRJcv0UVH1JqF-R2MtxrfV9srMBaMc3E', 0, 0, NULL, NULL, 0, NULL, NULL, NULL),
(27, 'thu1233', 'hoangthuw01@gmail.com', '$2b$10$pCUMhO48kgMe7WAzR/Rx8uppL.EpyuKg3QIjuZxdpOUgMXkbN0VOC', 'hoang thuu', 'https://ui-avatars.com/api/?name=hoang%20thuu&background=random&color=fff&size=128', '', NULL, '2026-01-27 17:09:52', 'user', NULL, 0, 0, NULL, NULL, 1, NULL, NULL, NULL),
(34, 'tuanthu', 'hoangtuanthu981@gmail.com', '$2b$10$cAcob1wvDUSLcR9f.smdX.vp0bbz6PCjZkKw3iK0Y25qkYPOy9IRi', 'Thư Hoàng Tuấn', 'http://localhost:5000/uploads/0f7559f43d657ac74ed8e610f8a6b2c0', '', 'hi', '2026-01-27 17:56:23', 'user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzQsImlhdCI6MTc3MDE1MzE5NywiZXhwIjoxNzcwNzU3OTk3fQ.5RkWgDuxOFUvQL-EpKID264MVeY0gH_3kbcP8BqfVzo', 0, 0, NULL, '2026-01-31 22:12:12', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_follows`
--

CREATE TABLE `user_follows` (
  `id` int(11) NOT NULL,
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `user_follows`
--

INSERT INTO `user_follows` (`id`, `follower_id`, `followed_id`, `created_at`) VALUES
(49, 5, 1, '2026-01-21 10:16:28'),
(50, 14, 1, '2026-01-21 15:38:25'),
(52, 6, 1, '2026-01-27 12:08:10');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `community_comments`
--
ALTER TABLE `community_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `community_likes`
--
ALTER TABLE `community_likes`
  ADD PRIMARY KEY (`user_id`,`post_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Chỉ mục cho bảng `community_posts`
--
ALTER TABLE `community_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`user_id`,`recipe_id`),
  ADD KEY `recipe_id` (`recipe_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recipes_ibfk_1` (`author_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `follower_id` (`follower_id`),
  ADD KEY `followed_id` (`followed_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `community_comments`
--
ALTER TABLE `community_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `community_posts`
--
ALTER TABLE `community_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT cho bảng `recipes`
--
ALTER TABLE `recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `community_comments`
--
ALTER TABLE `community_comments`
  ADD CONSTRAINT `community_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `community_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `community_likes`
--
ALTER TABLE `community_likes`
  ADD CONSTRAINT `community_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `community_likes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `community_posts`
--
ALTER TABLE `community_posts`
  ADD CONSTRAINT `community_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  ADD CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
