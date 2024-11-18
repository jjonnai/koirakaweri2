import * as ImagePicker from "expo-image-picker";
import { ref, update, get } from "firebase/database";

export const pickImage = async (setProfileImage, saveProfileImage) => {
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
    console.log("Kuvan URI gallerian valinnasta:", uri);
    setProfileImage(uri);
    saveProfileImage(uri);
  }
};

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
    console.log("Kuvan URI kamerasta:", uri);
    setProfileImage(uri);
    saveProfileImage(uri);
  }
};

export const saveProfileImage = async (uri, auth, database) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Käyttäjä ei ole kirjautunut sisään.");
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

export const fetchProfileImage = async (setProfileImage, auth, database) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Käyttäjä ei ole kirjautunut sisään.");
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
        console.log("Aseta URI tilaan");
      }
    }
  } catch (error) {
    console.error("Virhe profiilikuvan hakemisessa:", error);
  }
};