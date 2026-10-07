// src/main/java/com/example/dto/EmployeeInfoDTO.java
package com.enterprise.supply.DTO;

public class EmployeeInfoDTO {
    private String name;
    private String phone;
    private String workstation;

    public EmployeeInfoDTO() {}

    public EmployeeInfoDTO(String name, String phone, String workstation) {
        this.name = name;
        this.phone = phone;
        this.workstation = workstation;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getWorkstation() { return workstation; }
    public void setWorkstation(String workstation) { this.workstation = workstation; }
}
