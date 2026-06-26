package controllers

import (
	"net/http"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
)

type DailyCashData struct {
	Date  string `json:"date"`
	Total int64  `json:"total"`
	Count int    `json:"count"`
}

func GetCashBalance(c *gin.Context) {
	db := config.DB

	// Kas hari ini (cash + qris + debit all count, tapi saldo kas = cash only)
	var todayCash int64
	db.Model(&models.Transaction{}).
		Where("payment_method = 'cash' AND DATE(created_at) = CURDATE()").
		Select("COALESCE(SUM(total), 0)").Scan(&todayCash)

	// Kas bulan ini
	var monthCash int64
	db.Model(&models.Transaction{}).
		Where("payment_method = 'cash' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())").
		Select("COALESCE(SUM(total), 0)").Scan(&monthCash)

	// Kas keseluruhan
	var allCash int64
	db.Model(&models.Transaction{}).
		Where("payment_method = 'cash'").
		Select("COALESCE(SUM(total), 0)").Scan(&allCash)

	// Total transaksi tunai hari ini (jumlah transaksi)
	var todayCount int64
	db.Model(&models.Transaction{}).
		Where("payment_method = 'cash' AND DATE(created_at) = CURDATE()").
		Count(&todayCount)

	// Rincian harian 30 hari terakhir (cash only)
	var dailyData []DailyCashData
	db.Model(&models.Transaction{}).
		Select("DATE(created_at) as date, COALESCE(SUM(total), 0) as total, COUNT(*) as count").
		Where("payment_method = 'cash' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)").
		Group("DATE(created_at)").
		Order("date DESC").
		Scan(&dailyData)

	// Ringkasan per metode pembayaran hari ini
	type PaymentSummary struct {
		Method string `json:"method"`
		Total  int64  `json:"total"`
		Count  int    `json:"count"`
	}
	var paymentSummary []PaymentSummary
	db.Model(&models.Transaction{}).
		Select("payment_method as method, COALESCE(SUM(total), 0) as total, COUNT(*) as count").
		Where("DATE(created_at) = CURDATE()").
		Group("payment_method").
		Scan(&paymentSummary)

	c.JSON(http.StatusOK, gin.H{
		"today_cash":      todayCash,
		"today_count":     todayCount,
		"month_cash":      monthCash,
		"all_time_cash":   allCash,
		"daily_data":      dailyData,
		"payment_summary": paymentSummary,
	})
}
