package com.example.cng_booking.projections;

public class PumpResponseDTO {
    private String id;
    private String name;
    private String location;
    private String distance;
    private String rating;
    private double latitude;
    private double longitude;

    public PumpResponseDTO(String id, String name, String location, String distance, String rating, double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.distance = distance;
        this.rating = rating;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getLocation() { return location; }
    public String getDistance() { return distance; }
    public String getRating() { return rating; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
}
