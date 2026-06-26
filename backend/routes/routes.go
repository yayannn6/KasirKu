package routes

import (
	"kasirku/controllers"
	"kasirku/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	// Auth
	api.POST("/login", controllers.Login)

	// Protected routes
	auth := api.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/profile", controllers.GetProfile)

		// Products (kasir bisa GET, admin bisa semua)
		auth.GET("/products", controllers.GetProducts)
		auth.GET("/products/:id", controllers.GetProduct)

		// Transactions
		auth.POST("/transactions", controllers.CreateTransaction)
		auth.GET("/transactions", controllers.GetTransactions)
		auth.GET("/transactions/:id", controllers.GetTransaction)

		// Admin only routes
		admin := auth.Group("/")
		admin.Use(middleware.AdminOnly())
		{
			// Product management
			admin.POST("/products", controllers.CreateProduct)
			admin.PUT("/products/:id", controllers.UpdateProduct)
			admin.DELETE("/products/:id", controllers.DeleteProduct)
			admin.PUT("/products/:id/restore", controllers.RestoreProduct)

			// User management
			admin.GET("/users", controllers.GetUsers)
			admin.POST("/users", controllers.CreateUser)
			admin.PUT("/users/:id/toggle-status", controllers.ToggleUserStatus)
			admin.PUT("/users/:id/change-role", controllers.ChangeRole)
			admin.PUT("/users/:id/reset-password", controllers.ResetPassword)

			// Dashboard & Reports
			admin.GET("/dashboard", controllers.GetDashboard)
			admin.GET("/reports/sales", controllers.GetSalesReport)
			admin.GET("/cash-balance", controllers.GetCashBalance)
		}
	}
}
