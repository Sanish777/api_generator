DELIMITER $$
CREATE PROCEDURE sp_get_perfumes(IN p_page INT, IN p_limit INT, OUT p_total INT)
BEGIN
    -- Declare a handler for any errors that occur
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Handle the error
        SET p_total = 0;
    END;

    -- Get the total count of perfumes
    SELECT COUNT(*) INTO p_total FROM perfumes;

    -- Return paginated data
    SELECT id, title, description, published, stock, image, category, label, occasion, size
    FROM perfumes
    ORDER BY id
    LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END$$
DELIMITER ;