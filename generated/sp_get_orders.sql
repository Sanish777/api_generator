DELIMITER $$
CREATE PROCEDURE sp_get_orders(IN p_page INT, IN p_limit INT, OUT p_total INT)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Error handling
        SET p_total = 0;
    END;

    -- Parameter validation
    IF p_page < 1 THEN SET p_page = 1; END IF;
    IF p_limit < 1 THEN SET p_limit = 1; END IF;

    -- Calculate offset
    SET v_offset = (p_page - 1) * p_limit;

    -- Get total count
    SELECT COUNT(*) INTO p_total FROM orders;

    -- Return paginated data
    SELECT id, Order_id, order_date, payment_status, status, Price, User_id, cart 
    FROM orders 
    ORDER BY id 
    LIMIT p_limit OFFSET v_offset;
END $$
DELIMITER ;