plugins {
    java
}

group = "com.stagesexy"
version = "0.1.0"

repositories {
    maven(url = "https://maven.bitwig.com/")
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

tasks.jar {
    archiveFileName.set("StageSexyInstrumentSelector.bwextension")
}

tasks.test {
    useJUnitPlatform()
}

dependencies {
    implementation("com.bitwig:extension-api:19")

    testImplementation(platform("org.junit:junit-bom:5.11.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}
