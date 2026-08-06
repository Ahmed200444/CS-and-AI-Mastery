WITH spend AS (
  SELECT o.customer_id, SUM(oi.quantity*oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON o.order_id=oi.order_id
  WHERE o.status='completed' GROUP BY o.customer_id)
SELECT customer_id, ROUND(total,2) AS total
FROM spend ORDER BY total DESC LIMIT 5;