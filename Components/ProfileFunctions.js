import * as ImagePicker from "expo-image-picker";
import { ref, update, get } from "firebase/database";


//Kuvan valitseminen galleriasta
export const pickProfileImage = async (setProfileImage, saveProfileImage) => {
  //Pyydetään lupa käyttää galleriaa
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Pääsy galleriaan on estetty.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    setProfileImage(uri);
    saveProfileImage(uri);
  }
};

//Sama lemmikin kuvan kanssa, jos lupa on myönnetty ei pyydetä toista kertaa
export const pickPetImage = async (setPetImage) => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Pääsy galleriaan on estetty.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    setPetImage(uri);
  }
};


//Funktio kuvan ottamiseen puhelimen kameralla
export const takePhoto = async (setProfileImage, saveProfileImage) => {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Pääsy kameraan on estetty.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    setProfileImage(uri);
    saveProfileImage(uri);
  }
};

//Profiilikuvan tallentaminen tietokantaan
export const saveProfileImage = async (uri, auth, database) => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Käyttäjä ei ole kirjautunut sisään.");
    return;
  }

  const userEmail = user.email.replace(/\./g, "_");
  const userRef = ref(database, `users/${userEmail}`);

  try {
    await update(userRef, { profileImage: uri });
    console.log("Profiilikuva tallennettu tietokantaan.");
  } catch (error) {
    console.error("Virhe profiilikuvan tallennuksessa:", error);
  }
};

//Profiilikuvan hakeminen tietokannasta
export const fetchProfileImage = async (setProfileImage, auth, database) => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Käyttäjä ei ole kirjautunut sisään.");
    return;
  }

  const userEmail = user.email.replace(/\./g, "_");
  const userRef = ref(database, `users/${userEmail}`);

  try {
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
      const data = userSnapshot.val();
      if (data.profileImage) {
        setProfileImage(data.profileImage);
      }
    }
  } catch (error) {
    console.error("Virhe profiilikuvan hakemisessa:", error);
  }
};

//Lemmikkin kuvan tallentaminen tietokantaan
export const savePetImage = async (uri, auth, database, petId) => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Käyttäjä ei ole kirjautunut sisään.");
    return;
  }

  const userEmail = user.email.replace(/\./g, "_");
  const petsRef = ref(database, `users/${userEmail}/pets/${petId}`); 

  try {
    await update(petsRef, { petImage: uri });
    console.log("Lemmikkikuva tallennettu tietokantaan.");
  } catch (error) {
    console.error("Virhe lemmikkikuvan tallennuksessa:", error);
  }
};


//Ja hakeminen
export const fetchPetImage = async (setPetImage, auth, database, petId) => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Käyttäjä ei ole kirjautunut sisään.");
    return;
  }

  const userEmail = user.email.replace(/\./g, "_");
  const petsRef = ref(database, `users/${userEmail}/pets/${petId}`); 

  try {
    const petsSnapshot = await get(petsRef);
    if (petsSnapshot.exists()) {
      const data = petsSnapshot.val();
      if (data.petImage) {
        setPetImage(data.petImage);
        console.log("Lemmikkikuva haettu onnistuneesti.");
      }
    }
  } catch (error) {
    console.error("Virhe lemmikkikuvan hakemisessa:", error);
  }
};