package com.enterprise.supply.entity;

import javax.persistence.*;

@Entity
@Table(name = "t_staff")
public class Employee {

    @Id
    private String id; // 员工ID，对应sys_user的username或id的字符串形式
    
    private String name;
    private String phone;
    private String workstation; // 工位

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getWorkstation() { return workstation; }
    public void setWorkstation(String workstation) { this.workstation = workstation; }
}
