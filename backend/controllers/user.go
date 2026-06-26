package controllers

import (
	"net/http"

	"kasirku/config"
	"kasirku/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserInput struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"` // "admin" atau "kasir", default "kasir"
}

func GetUsers(c *gin.Context) {
	var users []models.User
	query := config.DB

	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR username LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Order("created_at DESC").Find(&users)
	c.JSON(http.StatusOK, gin.H{"data": users, "total": len(users)})
}

func CreateUser(c *gin.Context) {
	var input UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi role
	role := input.Role
	if role != "admin" && role != "kasir" {
		role = "kasir"
	}

	// Cek username sudah ada
	var existing models.User
	if err := config.DB.Where("username = ?", input.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username sudah digunakan"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Username: input.Username,
		Password: string(hashed),
		Role:     role,
		Status:   "aktif",
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pengguna"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Pengguna berhasil ditambahkan", "data": user})
}

func ToggleUserStatus(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	newStatus := "aktif"
	if user.Status == "aktif" {
		newStatus = "nonaktif"
	}

	config.DB.Model(&user).Update("status", newStatus)
	c.JSON(http.StatusOK, gin.H{"message": "Status berhasil diubah", "data": user})
}

func ChangeRole(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	var body struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role wajib diisi"})
		return
	}

	if body.Role != "admin" && body.Role != "kasir" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role harus 'admin' atau 'kasir'"})
		return
	}

	config.DB.Model(&user).Update("role", body.Role)
	config.DB.First(&user, user.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Peran berhasil diubah", "data": user})
}

func ResetPassword(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	var body struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru wajib diisi"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
		return
	}

	config.DB.Model(&user).Update("password", string(hashed))
	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil direset"})
}
