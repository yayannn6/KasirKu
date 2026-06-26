package main

import (
	"log"
	"time"

	"kasirku/config"
	"kasirku/models"
	"kasirku/routes"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	// Set timezone Go ke WIB (Asia/Jakarta = UTC+7)
	// Di server (UTC): time.Now() akan mengembalikan WIB, bukan UTC
	// Di lokal: jika TZ sistem sudah WIB, tidak ada perubahan
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		log.Println("⚠️  Gagal load timezone Asia/Jakarta, menggunakan timezone sistem")
		return
	}
	time.Local = loc
	log.Println("✅ Timezone aplikasi: Asia/Jakarta (WIB UTC+7)")
}

func main() {
	config.ConnectDatabase()

	// Auto migrate
	config.DB.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Transaction{},
		&models.TransactionItem{},
	)

	// Seed admin default jika belum ada
	var adminCount int64
	config.DB.Model(&models.User{}).Where("role = 'admin'").Count(&adminCount)
	if adminCount == 0 {
		hashed, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		config.DB.Create(&models.User{
			Name:     "Administrator",
			Username: "admin",
			Password: string(hashed),
			Role:     "admin",
			Status:   "aktif",
		})
		log.Println("Admin default dibuat: username=admin, password=admin123")
	}

	r := gin.Default()
	routes.SetupRoutes(r)

	port := "8080"
	log.Printf("Server berjalan di http://localhost:%s", port)
	r.Run(":" + port)
}
